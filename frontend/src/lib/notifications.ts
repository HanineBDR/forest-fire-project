/**
 * INKAD Realtime Notifications & Panel Intercom Helpers
 * Queries and updates Neon Lakebase Postgres (notifications, alert_acknowledgments, alerts)
 */

import { getNeonSql } from "@/lib/neon";
import type { NotificationRecord, AlertAcknowledgmentRecord } from "./notificationTypes";
export type { NotificationRecord, AlertAcknowledgmentRecord };
import { ROLE_LABELS } from "./notificationTypes";
export { ROLE_LABELS };

/**
 * Creates an alert in alerts table and dispatches 3 notifications
 * to Protection Civile, Administration Centrale, and Mohafadat El Ghabat.
 */
export async function createAlertAndNotifications(params: {
  wilaya: string;
  massif: string;
  risk_level: string;
  risk_score?: number;
  temp?: number;
  humidity?: number;
  wind?: number;
  lat?: number;
  lon?: number;
}) {
  const sql = getNeonSql();
  const {
    wilaya,
    massif,
    risk_level,
    risk_score = 85.0,
    temp = 38.0,
    humidity = 20.0,
    wind = 25.0,
    lat = 36.735,
    lon = 4.435,
  } = params;

  const wClean = wilaya.replace(/[^a-zA-Z0-9]/g, "");
  const mClean = massif.replace(/[^a-zA-Z0-9]/g, "");
  const alert_id = `ALERT-${wClean}-${mClean}-${Date.now()}`;

  const norm_level =
    risk_level.toLowerCase().includes("très") ||
    risk_level.toLowerCase().includes("very") ||
    risk_score >= 80
      ? "Très Elevé"
      : "Elevé";

  // 1. Insert or update alert in alerts table
  await sql`
    INSERT INTO alerts (alert_id, lat, lon, wilaya, forest_name, risk_score, risk_level, temp, humidity, wind, wind_dir, status, created_at, updated_at)
    VALUES (
      ${alert_id},
      ${lat},
      ${lon},
      ${wilaya},
      ${massif},
      ${risk_score},
      ${norm_level},
      ${temp},
      ${humidity},
      ${wind},
      'Sud (Sirocco)',
      'DETECTED',
      NOW(),
      NOW()
    )
    ON CONFLICT (alert_id) DO UPDATE SET
      risk_score = EXCLUDED.risk_score,
      risk_level = EXCLUDED.risk_level,
      updated_at = NOW()
  `;

  // 2. Insert 3 notifications (one per panel)
  const panels = [
    {
      role: "protection_civile",
      action: "Operational Alert: Mobilize mobile columns and pre-position intervention assets.",
    },
    {
      role: "admin_centrale",
      action: "Strategic Alert: High wildfire risk. Inter-wilaya coordination activated.",
    },
    {
      role: "mohafadat_ghabat",
      action: "Field Alert: Increased surveillance of DGF watchtowers and patrol rounds required.",
    },
  ];

  const createdNotifications: any[] = [];
  for (const p of panels) {
    const title = `Risk ${norm_level} detected at ${massif} (${wilaya})`;
    const message = `AI model (XGBoost + FWI) signals a hazard of ${risk_score.toFixed(1)}% (${temp}°C, ${humidity}% RH, ${wind} km/h). ${p.action}`;

    const [notif] = await sql`
      INSERT INTO notifications (
        alert_id, sender_role, recipient_role, title, message,
        risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
      ) VALUES (
        ${alert_id},
        'ai_model',
        ${p.role},
        ${title},
        ${message},
        ${norm_level},
        ${risk_score},
        ${massif},
        ${wilaya},
        ${lat},
        ${lon},
        FALSE,
        NOW()
      )
      RETURNING *
    `;
    createdNotifications.push(notif);
  }

  return {
    alert_id,
    risk_level: norm_level,
    risk_score,
    notifications: createdNotifications,
  };
}

/**
 * Lists notifications filtered by recipient role and unread status.
 */
export async function fetchNotificationsFromDb(
  role?: string | null,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<NotificationRecord[]> {
  const sql = getNeonSql();

  if (role && role !== "all") {
    if (unreadOnly) {
      return (await sql`
        SELECT * FROM notifications
        WHERE (recipient_role = ${role} OR recipient_role = 'all')
          AND is_read = FALSE
        ORDER BY created_at DESC
        LIMIT ${limit}
      `) as NotificationRecord[];
    } else {
      return (await sql`
        SELECT * FROM notifications
        WHERE (recipient_role = ${role} OR recipient_role = 'all')
        ORDER BY created_at DESC
        LIMIT ${limit}
      `) as NotificationRecord[];
    }
  } else {
    if (unreadOnly) {
      return (await sql`
        SELECT * FROM notifications
        WHERE is_read = FALSE
        ORDER BY created_at DESC
        LIMIT ${limit}
      `) as NotificationRecord[];
    } else {
      return (await sql`
        SELECT * FROM notifications
        ORDER BY created_at DESC
        LIMIT ${limit}
      `) as NotificationRecord[];
    }
  }
}

/**
 * Marks notification as read.
 */
export async function markNotificationReadInDb(id: number): Promise<boolean> {
  const sql = getNeonSql();
  const rows = await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Dispatches an intercom alert from one operational panel to another.
 */
export async function createPanelIntercomAlert(params: {
  from_role: string;
  to_role: string;
  alert_id?: string | null;
  message: string;
  title?: string | null;
  massif?: string | null;
  wilaya?: string | null;
  lat?: number | null;
  lon?: number | null;
  risk_level?: string | null;
  risk_score?: number | null;
}) {
  const sql = getNeonSql();
  const senderLabel = ROLE_LABELS[params.from_role] || params.from_role;
  const title =
    params.title ||
    (params.massif
      ? `Signalement Terrain (${params.massif}) - ${senderLabel}`
      : `Message Opérationnel de ${senderLabel}`);

  // 0. Ensure alert exists in alerts table to satisfy foreign key constraint and show on alerts map
  if (params.alert_id) {
    try {
      await sql`
        INSERT INTO alerts (
          alert_id, lat, lon, wilaya, forest_name, risk_score, risk_level, status, created_at, updated_at
        ) VALUES (
          ${params.alert_id},
          ${params.lat || null},
          ${params.lon || null},
          ${params.wilaya || null},
          ${params.massif || null},
          ${params.risk_score || 85.0},
          ${params.risk_level || "CRITICAL"},
          'DETECTED',
          NOW(),
          NOW()
        )
        ON CONFLICT (alert_id) DO UPDATE SET
          risk_score = EXCLUDED.risk_score,
          risk_level = EXCLUDED.risk_level,
          updated_at = NOW()
      `;
    } catch (alertErr) {
      console.warn("Could not insert/upsert alert in alerts table:", alertErr);
    }
  }

  // 1. Insert notification for target panel (with resilient FK fallback)
  let notif: any = null;
  try {
    const [inserted] = await sql`
      INSERT INTO notifications (
        alert_id, sender_role, recipient_role, title, message,
        risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
      ) VALUES (
        ${params.alert_id || null},
        ${params.from_role},
        ${params.to_role},
        ${title},
        ${params.message},
        ${params.risk_level || "Elevé"},
        ${params.risk_score || 75.0},
        ${params.massif || null},
        ${params.wilaya || null},
        ${params.lat || null},
        ${params.lon || null},
        FALSE,
        NOW()
      )
      RETURNING *
    `;
    notif = inserted;
  } catch (notifErr: any) {
    // If foreign key constraint failed, retry with alert_id = NULL
    if (notifErr?.code === "23503") {
      const [insertedFallback] = await sql`
        INSERT INTO notifications (
          alert_id, sender_role, recipient_role, title, message,
          risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
        ) VALUES (
          NULL,
          ${params.from_role},
          ${params.to_role},
          ${title},
          ${params.message},
          ${params.risk_level || "Elevé"},
          ${params.risk_score || 75.0},
          ${params.massif || null},
          ${params.wilaya || null},
          ${params.lat || null},
          ${params.lon || null},
          FALSE,
          NOW()
        )
        RETURNING *
      `;
      notif = insertedFallback;
    } else {
      throw notifErr;
    }
  }

  // 2. Insert record in alert_acknowledgments (safe non-blocking)
  let ack: any = null;
  try {
    const [insertedAck] = await sql`
      INSERT INTO alert_acknowledgments (
        alert_id, user_role, action, comment, target_role, created_at
      ) VALUES (
        ${params.alert_id || "GENERAL-DISPATCH"},
        ${params.from_role},
        'alerted_other',
        ${params.message},
        ${params.to_role},
        NOW()
      )
      RETURNING *
    `;
    ack = insertedAck;
  } catch (ackErr) {
    console.warn("Could not insert alert_acknowledgment:", ackErr);
  }

  return { notification: notif, acknowledgment: ack };
}

/**
 * Acknowledges, escalates, or resolves an alert, notifying partner panels.
 */
export async function createAcknowledgmentInDb(params: {
  alert_id: string;
  user_role: string;
  action: "acknowledged" | "escalated" | "resolved" | "alerted_other" | string;
  comment?: string | null;
  target_role?: string | null;
}) {
  const sql = getNeonSql();
  const userLabel = ROLE_LABELS[params.user_role] || params.user_role;

  const [ack] = await sql`
    INSERT INTO alert_acknowledgments (
      alert_id, user_role, action, comment, target_role, created_at
    ) VALUES (
      ${params.alert_id},
      ${params.user_role},
      ${params.action},
      ${params.comment || `Action ${params.action} effectuée par ${userLabel}`},
      ${params.target_role || null},
      NOW()
    )
    RETURNING *
  `;

  // If status change (acknowledged, escalated, resolved), notify other panels
  const otherRoles = ["protection_civile", "admin_centrale", "mohafadat_ghabat"].filter(
    (r) => r !== params.user_role
  );

  const actionTitles: Record<string, string> = {
    acknowledged: `${userLabel} acknowledged alert ${params.alert_id}`,
    escalated: `${userLabel} escalated alert ${params.alert_id}`,
    resolved: `${userLabel} marked alert ${params.alert_id} as contained`,
  };

  const title = actionTitles[params.action] || `Update on alert ${params.alert_id}`;
  const message = params.comment || `Status updated by ${userLabel}: ${params.action}.`;

  for (const r of otherRoles) {
    await sql`
      INSERT INTO notifications (
        alert_id, sender_role, recipient_role, title, message,
        risk_level, is_read, created_at
      ) VALUES (
        ${params.alert_id},
        ${params.user_role},
        ${r},
        ${title},
        ${message},
        'Information',
        FALSE,
        NOW()
      )
    `;
  }

  return ack;
}

/**
 * Unified timeline of notifications and acknowledgments.
 */
export async function fetchTimelineFromDb(limit: number = 50) {
  const sql = getNeonSql();
  const notifs = await sql`
    SELECT 
      'notification' as item_type,
      id, alert_id, sender_role, recipient_role, title, message,
      risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
    FROM notifications
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const acks = await sql`
    SELECT 
      'acknowledgment' as item_type,
      id, alert_id, user_role, action, comment, target_role, created_at
    FROM alert_acknowledgments
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const timeline = [...notifs, ...acks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return timeline.slice(0, limit);
}

