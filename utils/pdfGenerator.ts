import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Settings, SaleRecord, Product } from '../types';
import { blobToDataURL } from './image';

interface PDFPaymentStats {
    cash: number;
    card: number;
    token: number;
    check: number;
    paypal: number;
    wero: number;
}

interface PDFAnalytics {
    totalRevenue: number;
    totalDonations: number;
    estimatedFees: number;
    netRevenueAfterFees: number;
    beneficeNet: number;
    totalCostOfGoods: number;
    grossProfit: number;
    cashSales: number;
    cardSales: number;
    checkSales: number;
    paypalSales: number;
    weroSales: number;
    totalRemboursements: number;
    totalCashOuts: number;
    caisseFinaleEspeces: number;
    totalEncaissements: number;
    validSales: SaleRecord[];
    topProductsByQuantity: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    topProductsByProfit: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    salesByCategory: Array<{ name: string; revenue: number; count: number }>;
    chartData: Array<{ date: string; total: number }>;
    paymentStats: PDFPaymentStats;
}

// Fonction pour configurer les fonts UTF-8 avec support des accents français
const setupFonts = (doc: jsPDF) => {
    try {
        // Note: jsPDF supporte nativement UTF-8 avec les polices standard.
        // Pour les accents français (é, è, ê, à, ç, ü, etc.), utiliser 'helvetica' ou 'times'
        // qui supportent automatiquement le Latin-1 encoding.
        // La police Roboto nécessiterait une intégration complète de la ressource TTF,
        // ce qui n'est pas trivial en base64. Nous utilisons donc helvetica amélioré.
        
        doc.setFont('helvetica', 'normal');
        // jsPDF supporte UTF-8 par défaut avec les polices standard
        // Les caractères spéciaux comme é, è, ê, à, ç seront rendus correctement
    } catch (e) {
        console.warn('Erreur lors de la configuration des fonts, utilisation de la police par défaut:', e);
        doc.setFont('helvetica', 'normal');
    }
};

export const generateAdvancedPDF = async (
    doc: jsPDF,
    analytics: PDFAnalytics,
    settings: Settings,
    period: '7d' | '30d' | 'all',
    isPro: boolean,
    isStandardOrPro: boolean
) => {
    // Configurer les fonts UTF-8 pour les accents français
    setupFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let finalY = 20;

    // Couleurs modernes - TypedArray pour jsPDF
    const colors: Record<string, [number, number, number]> = {
        primary: [37, 99, 235],      // Bleu
        success: [16, 185, 129],     // Vert
        warning: [249, 115, 22],     // Orange
        danger: [239, 68, 68],       // Rouge
        purple: [147, 51, 234],      // Violet
        pink: [236, 72, 153],        // Rose
        cyan: [6, 182, 212],         // Cyan
        gray: [107, 114, 128],       // Gris
    };

    // --- HEADER avec Logo ---
    if (settings.businessLogo) {
        let logoDataUrl = '';
        if (settings.businessLogo instanceof Blob) logoDataUrl = await blobToDataURL(settings.businessLogo);
        else if (typeof settings.businessLogo === 'string' && settings.businessLogo.startsWith('data:')) logoDataUrl = settings.businessLogo;

        if (logoDataUrl) {
            try {
                const img = new Image();
                img.src = logoDataUrl;
                await new Promise(r => { img.onload = r; img.onerror = r; });
                const logoHeight = 16;
                const logoWidth = (img.width * logoHeight) / img.height;
                doc.addImage(logoDataUrl, 'PNG', margin, 12, logoWidth, logoHeight);
                finalY = 35;
            } catch (e) {
                console.error('Logo error:', e);
            }
        }
    }

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text(settings.businessName || 'KAYÉ', pageWidth - margin, finalY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    const periodText = period === '7d' ? '7 derniers jours' : period === '30d' ? '30 derniers jours' : 'Tout l\'événement';
    doc.text(`Rapport Financier - ${periodText}`, pageWidth - margin, finalY + 8, { align: 'right' });
    doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, finalY + 14, { align: 'right' });

    finalY += 25;

    // --- SECTION 1: KPI CARDS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues in PDF viewers/fonts
    doc.text('Indicateurs Clés de Performance', margin, finalY);
    finalY += 8;

    // KPI Cards
    const kpiData = [
        { label: 'Chiffre d\'Affaires', value: `${analytics.totalRevenue.toFixed(2)}€`, color: colors.primary },
        { label: 'Net Estimé', value: `${analytics.netRevenueAfterFees.toFixed(2)}€`, color: colors.success },
        { label: 'Frais Bancaires', value: `-${analytics.estimatedFees.toFixed(2)}€`, color: colors.danger },
        ...(isPro ? [{ label: 'Bénéfice Net', value: `${analytics.beneficeNet.toFixed(2)}€`, color: colors.warning }] : []),
    ];

    const kpiWidth = (pageWidth - margin * 2) / Math.min(kpiData.length, 4);
    kpiData.forEach((kpi, idx) => {
        const x = margin + idx * kpiWidth;
        // Fond coloré
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(x, finalY, kpiWidth - 2, 20, 'F');
        // Texte
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.label, x + 2, finalY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(kpi.value, x + 2, finalY + 14);
    });
    finalY += 28;

    // --- SECTION 2: RÉSUMÉ FINANCIER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues
    doc.text('Résumé Financier Détaillé', margin, finalY);
    finalY += 6;

    const summaryBody: string[][] = [
        ['Chiffre d\'Affaires Total', `${analytics.totalRevenue.toFixed(2)}€`, 'CA'],
        ['Total des Dons', `${analytics.totalDonations.toFixed(2)}€`, 'Dons'],
        ['Total Encaissé', `${analytics.totalEncaissements.toFixed(2)}€`, 'Trésorerie'],
        ['Frais Bancaires (Est.)', `-${analytics.estimatedFees.toFixed(2)}€`, 'Frais'],
        ['Net Estimé (après frais)', `${analytics.netRevenueAfterFees.toFixed(2)}€`, 'Net'],
    ];

    if (isPro) {
        summaryBody.push(
            ['Coût des Marchandises', `-${analytics.totalCostOfGoods.toFixed(2)}€`, 'COGS'],
            ['Marge Brute', `${analytics.grossProfit.toFixed(2)}€`, 'Marge'],
            ['Bénéfice Net', `${analytics.beneficeNet.toFixed(2)}€`, 'Profit'],
            ['Remboursements', `-${analytics.totalRemboursements.toFixed(2)}€`, 'Refunds'],
            ['Sorties d\'Espèces', `-${analytics.totalCashOuts.toFixed(2)}€`, 'Cash Out'],
            ['Caisse Finale (Espèces)', `${analytics.caisseFinaleEspeces.toFixed(2)}€`, 'Caisse'],
        );
    }

    autoTable(doc, {
        startY: finalY,
        head: [['Description', 'Montant', 'Type']],
        body: summaryBody,
        theme: 'grid',
        headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
        bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
        alternateRowStyles: { fillColor: [240, 245, 250] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center', cellWidth: 20 } },
        margin: { left: margin, right: margin },
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION 3: MODES DE PAIEMENT ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues
    doc.text('Répartition des Modes de Paiement', margin, finalY);
    finalY += 6;

    const paymentMethods = [
        { label: 'Espèces', amount: analytics.cashSales, color: colors.success },
        { label: 'Carte Bancaire', amount: analytics.cardSales, color: colors.primary },
        { label: 'PayPal', amount: analytics.paypalSales, color: colors.cyan },
        { label: 'Chèque', amount: analytics.checkSales, color: colors.purple },
        { label: 'Wero', amount: analytics.weroSales, color: colors.warning },
    ].filter(m => m.amount > 0);

    const paymentBody = paymentMethods.map(method => [
        method.label,
        `${method.amount.toFixed(2)}€`,
        `${((method.amount / analytics.totalEncaissements) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
        startY: finalY + 2,
        head: [['Méthode', 'Montant', 'Pourcentage']],
        body: paymentBody,
        theme: 'grid',
        headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
        bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
        alternateRowStyles: { fillColor: [240, 245, 250] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: margin, right: margin },
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION 4: FRAIS DÉTAILLÉS ---
    if (isPro) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        // Emoji removed to avoid encoding issues
        doc.text('Analyse Détaillée des Frais', margin, finalY);
        finalY += 6;

        const paypalSalesCount = analytics.validSales.filter(s => s.paymentMethod === 'paypal').length;
        const paypalFees = analytics.paypalSales > 0 ? (analytics.paypalSales * 0.029) + (paypalSalesCount * 0.35) : 0;
        const sumupFees = (analytics.cardSales + analytics.totalDonations) * 0.0175;

        const feesBody = [
            ['Frais PayPal (2.9% + 0.35€)', `${paypalFees.toFixed(2)}€`, `${(paypalSalesCount)} transactions`],
            ['Frais Sumup (1.75%)', `${sumupFees.toFixed(2)}€`, `Cartes + Dons`],
            ['Total Frais Estimés', `${(paypalFees + sumupFees).toFixed(2)}€`, 'Estimation'],
        ];

        autoTable(doc, {
            startY: finalY,
            head: [['Type de Frais', 'Montant', 'Détails']],
            body: feesBody,
            theme: 'grid',
            headStyles: { fillColor: colors.danger as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
            bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
            alternateRowStyles: { fillColor: [255, 240, 245] },
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: margin, right: margin },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- PAGE 2 ---
    if (isStandardOrPro) {
        doc.addPage();
        finalY = 15;

        // Top Produits
        if (analytics.topProductsByQuantity.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Top 5 Produits par Quantité', margin, finalY);
            finalY += 6;

            autoTable(doc, {
                startY: finalY,
                head: [['Rang', 'Produit', 'Vendus', 'Chiffre d\'Affaires']],
                body: analytics.topProductsByQuantity.slice(0, 5).map((p, i) => [
                    `${i + 1}`,
                    p.name,
                    `${p.unitsSold}`,
                    `${p.revenue.toFixed(2)}€`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.success as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [240, 250, 245] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Top Produits par Profit (Pro only)
        if (isPro && analytics.topProductsByProfit.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Top 5 Produits par Profit', margin, finalY);
            finalY += 6;

            autoTable(doc, {
                startY: finalY,
                head: [['Rang', 'Produit', 'Profit Net', 'Marge %']],
                body: analytics.topProductsByProfit.slice(0, 5).map((p, i) => [
                    `${i + 1}`,
                    p.name,
                    `${p.totalProfit.toFixed(2)}€`,
                    `${((p.totalProfit / p.revenue) * 100).toFixed(1)}%`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.warning as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [255, 250, 240] },
                columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Catégories
        if (analytics.salesByCategory.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Ventes par Catégorie', margin, finalY);
            finalY += 6;

            autoTable(doc, {
                startY: finalY,
                head: [['Catégorie', 'Revenu', 'Nombre de Ventes', 'Panier Moyen']],
                body: analytics.salesByCategory.map(c => [
                    c.name,
                    `${c.revenue.toFixed(2)}€`,
                    `${c.count}`,
                    `${(c.revenue / c.count).toFixed(2)}€`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [240, 245, 250] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Historique des ventes détaillé
        if (analytics.validSales.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Historique Détaillé des Ventes', margin, finalY);
            finalY += 6;

            const maxSalesInPDF = 50; // Limiter à 50 ventes pour ne pas rendre le PDF trop lourd
            const salesData = analytics.validSales.slice(0, maxSalesInPDF).map((sale, idx) => {
                const itemsSummary = sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 40);
                const cogs = sale.items.reduce((sum, i) => sum + ((i.purchasePrice || 0) * i.quantity), 0);
                const paypalFeeForSale = sale.paymentMethod === 'paypal' ? (sale.total * 0.029) + 0.35 : 0;
                const sumupFeeForSale = sale.paymentMethod === 'card' ? sale.total * 0.0175 : 0;
                const totalFees = paypalFeeForSale + sumupFeeForSale;
                const grossProfit = sale.total - cogs;
                const netProfit = grossProfit - totalFees;

                return [
                    `${idx + 1}`,
                    new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    itemsSummary,
                    `${sale.total.toFixed(2)}€`,
                    `${totalFees.toFixed(2)}€`,
                    `${netProfit.toFixed(2)}€`,
                    sale.paymentMethod,
                ];
            });

            autoTable(doc, {
                startY: finalY,
                head: [['#', 'Heure', 'Articles', 'Montant', 'Frais', 'Profit Net', 'Mode']],
                body: salesData,
                theme: 'grid',
                headStyles: { fillColor: colors.cyan as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 250, 250] },
                columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
                margin: { left: margin, right: margin },
                didDrawPage: function (data: any) {
                    // Footer
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.getHeight();
                    const pageWidth = pageSize.getWidth();

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text(`Page ${data.pageNumber} sur ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                    doc.text(`Rapport généré par KAYÉ - ${new Date().toLocaleDateString('fr-FR')}`, margin, pageHeight - 10);
                },
            });
        }
    }

    // --- FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.line(margin, doc.internal.pageSize.getHeight() - 15, pageWidth - margin, doc.internal.pageSize.getHeight() - 15);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text(`Rapport généré par KAYÉ - ${new Date().toLocaleDateString('fr-FR')}`, margin, doc.internal.pageSize.getHeight() - 10);
    }
};
