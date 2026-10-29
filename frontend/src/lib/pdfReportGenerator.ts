/**
 * IN9AD Platform - Official Crisis & Tactical Report PDF Generator
 * Generates an official, printable Algerian Government Wildfire Alert Protocol
 * using client-side jsPDF + jspdf-autotable without backend dependencies.
 */

export interface TacticalReportData {
  massif: string;
  wilaya: string;
  wilayaCode: string;
  lat: number;
  lon: number;
  elevation: number;
  topography: string;
  temp: number;
  humidity: number;
  wind: number;
  windDir: string;
  co2: number;
  riskScore: number;
  riskLevel: string;
  fwi: number;
  ffmc: number;
  isi: number;
  bui: number;
  ros_m_min: number;
  ros_km_h: number;
  area_1h: number;
  area_3h: number;
  area_6h: number;
  propagationZone: string;
  hasHumanPopulation: boolean;
  populationCount: number;
  populationDetails: string;
  faunaSpecies: string;
  canopyDensityPercent: number;
  canopyDensityText: string;
  timestamp?: string;
  alertId?: string;
}

export async function generateOfficialTacticalReportPDF(data: TacticalReportData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 30;

  // 1. Official Header Bar (#0A4D3C)
  doc.setFillColor(10, 77, 60);
  doc.rect(margin, currentY, contentWidth, 54, "F");

  doc.setTextColor(245, 241, 232);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE", pageWidth / 2, currentY + 16, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "MINISTÈRE DE L'INTÉRIEUR · DIRECTION GÉNÉRALE DE LA PROTECTION CIVILE · DIRECTION GÉNÉRALE DES FORÊTS",
    pageWidth / 2,
    currentY + 30,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SYSTÈME NATIONAL DE VEILLE PRÉDICTIVE DES FEUX DE FORÊT (IN9AD)", pageWidth / 2, currentY + 46, {
    align: "center",
  });

  currentY += 66;

  // 2. Title & Alert Metadata Banner
  doc.setDrawColor(180, 83, 9);
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, currentY, contentWidth, 36, "FD");

  doc.setTextColor(146, 64, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PROCÈS-VERBAL OFFICIEL D'ALERTE INCENDIE - RÉSEAU CAPTEURS IOT & IA", margin + 12, currentY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15);
  const timeLabel = data.timestamp || new Date().toLocaleString("fr-FR");
  const alertRef = data.alertId || `ALERT-IOT-${Date.now().toString().slice(-6)}`;
  doc.text(`Réf : ${alertRef}  ·  Émission : ${timeLabel}  ·  Niveau : RISQUE CRITIQUE (${data.riskScore}%)`, margin + 12, currentY + 30);

  currentY += 46;

  // 3. Section 1: Localisation Géographique & Topographie
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["1. LOCALISATION GÉOGRAPHIQUE & TOPOGRAPHIE DU MASSIF", ""]],
    body: [
      ["Massif Forestier :", data.massif],
      ["Wilaya de Rattachement :", `${data.wilaya} (${data.wilayaCode})`],
      ["Coordonnées GPS :", `Latitude ${data.lat.toFixed(4)}° N, Longitude ${data.lon.toFixed(4)}° E`],
      ["Altitude Moyenne :", `${data.elevation} mètres au-dessus du niveau de la mer`],
      ["Relief & Typologie :", data.topography],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [241, 245, 249],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Section 2: Télémétrie Micro-Climatique Ingestion & Inférence IA
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["2. PARAMÈTRES MICRO-CLIMATIQUES INGÉRÉS PAR CAPTEURS IOT", ""]],
    body: [
      ["Température de l'Air :", `${data.temp.toFixed(1)} °C`],
      ["Humidité Relative de l'Air :", `${data.humidity} % (Seuil critique de sécheresse : <20%)`],
      ["Vitesse & Direction du Vent :", `${data.wind} km/h - Orientation : ${data.windDir}`],
      ["Gaz de Combustion & Fumée :", `${data.co2} ppm (Concentration anormale au-dessus de 750 ppm)`],
      ["Indice Canadien Météo Forêt (FWI) :", `FWI Global : ${data.fwi} (FFMC : ${data.ffmc}, ISI : ${data.isi}, BUI : ${data.bui})`],
      ["Score Prédictif Modèle IA XGBoost :", `${data.riskScore} % - Classification : ${data.riskLevel}`],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [241, 245, 249],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Section 3: Dynamique de Propagation du Front de Feu
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["3. DYNAMIQUE PRÉVISIONNELLE DU FEU & VITESSE D'EXPANSION", ""]],
    body: [
      ["Vitesse d'Avancée du Front (ROS) :", `${data.ros_m_min} m/min (${data.ros_km_h} km/h)`],
      ["Surfaces Menacées Projetées :", `À +1 heure : ${data.area_1h} ha   |   À +3 heures : ${data.area_3h} ha   |   À +6 heures : ${data.area_6h} ha`],
      ["Axe de Propagation Prévisionnel :", data.propagationZone],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [241, 245, 249],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 6. Section 4: Enjeux Humains & Recommandation d'Évacuation
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["4. ENJEUX HUMAINS & POPULATION CIVILE MENACÉE (DOUBLE ALERTE ADMIN CENTRALE)", ""]],
    body: [
      [
        "Statut Présence Humaine :",
        data.hasHumanPopulation ? "ZONE HABITÉE - RISQUE VITAL DIRECT" : "ZONE INHABITÉE (SANCTUAIRE NATUREL)",
      ],
      ["Dénombrement Population :", data.hasHumanPopulation ? `${data.populationCount.toLocaleString("fr-FR")} habitants recensés` : "Aucune population résidente permanente"],
      ["Agglomérations & Villages Exposés :", data.populationDetails],
      [
        "Directive Administration Centrale :",
        data.hasHumanPopulation
          ? "DÉCLENCHEMENT IMMÉDIAT DU PLAN ORSEC WILAYA. Évacuation préventive ordonnée des villages limitrophes, sécurisation des voies d'accès et mise en alerte des hôpitaux."
          : "Surveillance opérationnelle renforcée et interdiction temporaire d'accès aux pistes forestières.",
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: data.hasHumanPopulation ? [159, 18, 57] : [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 7. Section 5: Biodiversité & Combustible Forestier
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["5. BIODIVERSITÉ PROTÉGÉE & CHARGE COMBUSTIBLE", ""]],
    body: [
      ["Densité du Couvert Végétal :", `${data.canopyDensityPercent} %`],
      ["Typologie Combustible :", data.canopyDensityText],
      ["Faune Vulnérable Répertoriée :", data.faunaSpecies],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [241, 245, 249],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 8. Signatures & Destinataires Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 48, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("DESTINATAIRES OFFICIELS POUR ACTION IMMÉDIATE :", margin + 8, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("[X] Direction Générale de la Protection Civile (CODIS / Colonnes Mobiles)", margin + 8, currentY + 26);
  doc.text("[X] Direction Générale des Forêts / Mohafadat El Ghabat (Vigies & Brigades)", margin + 8, currentY + 38);
  doc.text("[X] Ministère de l'Intérieur / Administration Centrale (Gestion de Crise ORSEC)", margin + contentWidth / 2, currentY + 26);
  doc.text("Cachet électronique certifié : Plateforme Nationale IN9AD", margin + contentWidth / 2, currentY + 38);

  // Save PDF
  const cleanMassif = data.massif.replace(/[\s()]+/g, "_");
  const cleanWilaya = data.wilayaCode.replace(/[\s.]+/g, "");
  doc.save(`PV_ALERTE_INCENDIE_${cleanWilaya}_${cleanMassif}_${Date.now()}.pdf`);
}
