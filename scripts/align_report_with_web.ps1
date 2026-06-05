$ErrorActionPreference = 'Stop'

$sourceDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_chuong4_chi_tiet_v2.docx'
$targetDoc = 'D:\thuctap\chonongsan\cho_nong_san_FINAL\project\Bao_cao_website_cho_nong_san_hoan_thien_theo_web.docx'
$openXmlDll = 'C:\Program Files\Windows Defender Advanced Threat Protection\Classification\Dprt\DocumentFormat.OpenXml.dll'

Copy-Item $sourceDoc $targetDoc -Force

$code = @'
using System;
using System.Linq;
using System.Collections.Generic;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

public static class ReportAligner
{
    public static void Run(string path)
    {
        using (var doc = WordprocessingDocument.Open(path, true))
        {
            var body = doc.MainDocumentPart.Document.Body;

            ReplaceBetweenParagraphIndices(body, 1584, 1587, new[]
            {
                "Pháº§n phá»¥ lá»¥c nÃªn Ä‘Ã­nh kÃ¨m cÃ¡c hÃ¬nh áº£nh chá»¥p trá»±c tiáº¿p tá»« há»‡ thá»‘ng Ä‘á»ƒ minh há»a rÃµ cÃ¡c nhÃ³m chá»©c nÄƒng Ä‘Ã£ trÃ¬nh bÃ y trong bÃ¡o cÃ¡o.",
                "Gá»£i Ã½ hÃ¬nh áº£nh cáº§n chÃ¨n",
                "HÃ¬nh PL-1: Trang chá»§ cá»§a há»‡ thá»‘ng chá»£ nÃ´ng sáº£n. NÃªn chá»¥p pháº§n hero, thanh tÃ¬m kiáº¿m vÃ  khu vá»±c sáº£n pháº©m ná»•i báº­t.",
                "HÃ¬nh PL-2: Trang danh sÃ¡ch sáº£n pháº©m. NÃªn chá»¥p kÃ¨m bá»™ lá»c theo danh má»¥c, giÃ¡, tá»‰nh thÃ nh vÃ  khu vá»±c lÆ°á»›i sáº£n pháº©m.",
                "HÃ¬nh PL-3: Trang chi tiáº¿t sáº£n pháº©m. NÃªn hiá»ƒn thá»‹ áº£nh lá»›n, mÃ´ táº£, thÃ´ng tin nÃ´ng tráº¡i, Ä‘Ã¡nh giÃ¡ vÃ  cÃ¡c nÃºt thÃªm vÃ o giá» hÃ ng hoáº·c mua ngay.",
                "HÃ¬nh PL-4: Trang giá» hÃ ng vÃ  bÆ°á»›c xÃ¡c nháº­n Ä‘Æ¡n hÃ ng. Náº¿u cÃ³ thá»ƒ, chá»¥p hai áº£nh riÃªng cho bÆ°á»›c giá» hÃ ng vÃ  bÆ°á»›c nháº­p Ä‘á»‹a chá»‰ - chá»n phÆ°Æ¡ng thá»©c thanh toÃ¡n.",
                "HÃ¬nh PL-5: Danh sÃ¡ch Ä‘Æ¡n hÃ ng vÃ  chi tiáº¿t Ä‘Æ¡n hÃ ng cá»§a ngÆ°á»i mua.",
                "HÃ¬nh PL-6: Dashboard nÃ´ng dÃ¢n.",
                "HÃ¬nh PL-7: MÃ n hÃ¬nh quáº£n lÃ½ sáº£n pháº©m cá»§a nÃ´ng dÃ¢n, Æ°u tiÃªn chá»¥p cáº£ form thÃªm hoáº·c cáº­p nháº­t sáº£n pháº©m cÃ³ pháº§n chá»n áº£nh tá»« mÃ¡y.",
                "HÃ¬nh PL-8: Há»“ sÆ¡ nÃ´ng tráº¡i cá»§a nÃ´ng dÃ¢n.",
                "HÃ¬nh PL-9: Dashboard quáº£n trá»‹ viÃªn.",
                "HÃ¬nh PL-10: MÃ n hÃ¬nh quáº£n lÃ½ tÃ i khoáº£n á»Ÿ phÃ­a quáº£n trá»‹.",
                "HÃ¬nh PL-11: MÃ n hÃ¬nh quáº£n lÃ½ danh má»¥c vÃ  cá»­a sá»• xem sáº£n pháº©m theo danh má»¥c.",
                "HÃ¬nh PL-12: MÃ n hÃ¬nh quáº£n lÃ½ Ä‘Æ¡n hÃ ng á»Ÿ phÃ­a quáº£n trá»‹.",
                "HÃ¬nh PL-13: MÃ n hÃ¬nh tá»•ng quan kho hÃ ng vÃ  hÃ³a Ä‘Æ¡n kho.",
                "HÃ¬nh PL-14: MÃ n hÃ¬nh chi tiáº¿t hÃ³a Ä‘Æ¡n kho.",
                "HÃ¬nh PL-15: MÃ n hÃ¬nh tá»“n kho thá»ƒ hiá»‡n vá»‹ trÃ­ lÆ°u, háº¡n sá»­ dá»¥ng vÃ  thao tÃ¡c cáº­p nháº­t thÃ´ng tin lÆ°u kho.",
                "HÃ¬nh PL-16: MÃ n hÃ¬nh cáº£nh bÃ¡o kho vÃ  lá»‹ch sá»­ kho.",
                "LÆ°u Ã½ khi chÃ¨n hÃ¬nh: má»—i hÃ¬nh nÃªn cÃ³ chÃº thÃ­ch ngay bÃªn dÆ°á»›i, Ä‘Ã¡nh sá»‘ theo thá»© tá»± xuáº¥t hiá»‡n, sá»­ dá»¥ng áº£nh chá»¥p tá»« Ä‘Ãºng phiÃªn báº£n web hiá»‡n táº¡i vÃ  trÃ¡nh chÃ¨n cÃ¡c mÃ n hÃ¬nh hoáº·c chá»©c nÄƒng chÆ°a Ä‘Æ°á»£c triá»ƒn khai giao diá»‡n."
            });

            ReplaceBetweenParagraphIndices(body, 1571, 1584, new[]
            {
                "Trong quÃ¡ trÃ¬nh thá»±c hiá»‡n, há»‡ thá»‘ng Ä‘Æ°á»£c kiá»ƒm thá»­ thá»§ cÃ´ng theo tá»«ng nhÃ³m chá»©c nÄƒng chÃ­nh gá»“m xÃ¡c thá»±c vÃ  phÃ¢n quyá»n, quáº£n lÃ½ sáº£n pháº©m, giá» hÃ ng, Ä‘áº·t hÃ ng, quáº£n lÃ½ Ä‘Æ¡n hÃ ng, Ä‘Ã¡nh giÃ¡ sáº£n pháº©m, quáº£n trá»‹ tÃ i khoáº£n vÃ  váº­n hÃ nh kho hÃ ng.",
                "Káº¿t quáº£ kiá»ƒm thá»­ cho tháº¥y cÃ¡c luá»“ng chÃ­nh Ä‘ang hoáº¡t Ä‘á»™ng á»•n Ä‘á»‹nh: Ä‘Äƒng kÃ½ vÃ  Ä‘Äƒng nháº­p theo vai trÃ², xem vÃ  lá»c sáº£n pháº©m, thÃªm vÃ o giá» hÃ ng, táº¡o Ä‘Æ¡n hÃ ng, theo dÃµi Ä‘Æ¡n hÃ ng, Ä‘Ã¡nh giÃ¡ sáº£n pháº©m sau khi Ä‘Æ¡n Ä‘Ã£ giao, quáº£n lÃ½ sáº£n pháº©m cá»§a nÃ´ng dÃ¢n, duyá»‡t nÃ´ng dÃ¢n á»Ÿ phÃ­a quáº£n trá»‹ vÃ  xá»­ lÃ½ hÃ³a Ä‘Æ¡n kho.",
                "PhÃ¢n há»‡ kho Ä‘Æ°á»£c kiá»ƒm tra á»Ÿ cÃ¡c thao tÃ¡c táº¡o hÃ³a Ä‘Æ¡n nháº­p hoáº·c xuáº¥t kho, xÃ¡c nháº­n hÃ³a Ä‘Æ¡n, Ä‘á»“ng bá»™ tá»“n kho, cáº­p nháº­t vá»‹ trÃ­ lÆ°u vÃ  háº¡n sá»­ dá»¥ng, cÅ©ng nhÆ° phÃ¡t sinh cáº£nh bÃ¡o khi má»©c tá»“n xuá»‘ng tháº¥p.",
                "BÃªn cáº¡nh cÃ¡c káº¿t quáº£ Ä‘áº¡t Ä‘Æ°á»£c, há»‡ thá»‘ng hiá»‡n váº«n cÃ²n má»™t sá»‘ giá»›i háº¡n Ä‘Ãºng vá»›i phiÃªn báº£n Ä‘ang triá»ƒn khai. Cá»¥ thá»ƒ, phÆ°Æ¡ng thá»©c VNPay má»›i dá»«ng á»Ÿ má»©c ghi nháº­n lá»±a chá»n thanh toÃ¡n trong Ä‘Æ¡n hÃ ng chá»© chÆ°a káº¿t ná»‘i vá»›i cá»•ng thanh toÃ¡n thá»±c táº¿. NgoÃ i ra, má»™t sá»‘ API há»— trá»£ nhÆ° thÃ´ng bÃ¡o hiá»‡n chÆ°a Ä‘Æ°á»£c phÃ¡t triá»ƒn giao diá»‡n riÃªng trÃªn frontend.",
                "NhÃ¬n chung, phiÃªn báº£n hiá»‡n táº¡i Ä‘Ã£ Ä‘Ã¡p á»©ng tá»‘t má»¥c tiÃªu xÃ¢y dá»±ng má»™t website chá»£ nÃ´ng sáº£n cÃ³ phÃ¢n vai rÃµ rÃ ng, cÃ³ kháº£ nÄƒng váº­n hÃ nh Ä‘Æ¡n hÃ ng vÃ  cÃ³ má»Ÿ rá»™ng thÃªm lá»›p quáº£n lÃ½ kho phÃ¹ há»£p vá»›i Ä‘á»‹nh hÆ°á»›ng Ä‘á» tÃ i."
            });

            ReplaceBetweenParagraphIndices(body, 1563, 1571, new[]
            {
                "Há»‡ thá»‘ng Ä‘Æ°á»£c triá»ƒn khai theo mÃ´ hÃ¬nh frontend - backend tÃ¡ch biá»‡t. Frontend Ä‘Æ°á»£c xÃ¢y dá»±ng báº±ng React vÃ  React Router Ä‘á»ƒ tá»• chá»©c giao diá»‡n theo tá»«ng vai trÃ² sá»­ dá»¥ng. Backend Ä‘Æ°á»£c xÃ¢y dá»±ng báº±ng Node.js, Express vÃ  MySQL Ä‘á»ƒ cung cáº¥p API vÃ  xá»­ lÃ½ nghiá»‡p vá»¥.",
                "PhÃ¢n há»‡ khÃ¡ch hÃ ng hiá»‡n cÃ³ cÃ¡c mÃ n hÃ¬nh chÃ­nh gá»“m: trang chá»§, danh sÃ¡ch sáº£n pháº©m, trang chi tiáº¿t sáº£n pháº©m, giá» hÃ ng, danh sÃ¡ch Ä‘Æ¡n hÃ ng, chi tiáº¿t Ä‘Æ¡n hÃ ng, Ä‘Äƒng nháº­p, Ä‘Äƒng kÃ½ vÃ  há»“ sÆ¡ cÃ¡ nhÃ¢n.",
                "á»ž trang danh sÃ¡ch sáº£n pháº©m, ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ tÃ¬m kiáº¿m theo tá»« khÃ³a, lá»c theo danh má»¥c, tá»‰nh thÃ nh, khoáº£ng giÃ¡, tráº¡ng thÃ¡i cÃ²n hÃ ng vÃ  sáº¯p xáº¿p theo má»›i nháº¥t, giÃ¡ tÄƒng, giÃ¡ giáº£m, bÃ¡n cháº¡y hoáº·c Ä‘Ã¡nh giÃ¡.",
                "á»ž trang chi tiáº¿t sáº£n pháº©m, há»‡ thá»‘ng hiá»ƒn thá»‹ hÃ¬nh áº£nh sáº£n pháº©m, mÃ´ táº£, thÃ´ng tin nÃ´ng tráº¡i, Ä‘Ã¡nh giÃ¡, lá»±a chá»n sá»‘ lÆ°á»£ng, nÃºt thÃªm vÃ o giá» hÃ ng, nÃºt mua ngay vÃ  khá»‘i sáº£n pháº©m liÃªn quan.",
                "PhÃ¢n há»‡ nÃ´ng dÃ¢n gá»“m cÃ¡c mÃ n hÃ¬nh: tá»•ng quan nÃ´ng dÃ¢n, quáº£n lÃ½ sáº£n pháº©m, Ä‘Æ¡n hÃ ng cá»§a nÃ´ng dÃ¢n vÃ  há»“ sÆ¡ nÃ´ng tráº¡i. NÃ´ng dÃ¢n cÃ³ thá»ƒ thÃªm, sá»­a, áº©n hiá»‡n hoáº·c xÃ³a sáº£n pháº©m; chá»n áº£nh trá»±c tiáº¿p tá»« mÃ¡y; vÃ  cáº­p nháº­t thÃ´ng tin nÃ´ng tráº¡i nhÆ° tÃªn nÃ´ng tráº¡i, khu vá»±c hoáº¡t Ä‘á»™ng vÃ  pháº§n giá»›i thiá»‡u.",
                "PhÃ¢n há»‡ quáº£n trá»‹ viÃªn gá»“m cÃ¡c mÃ n hÃ¬nh: dashboard quáº£n trá»‹, quáº£n lÃ½ tÃ i khoáº£n, duyá»‡t nÃ´ng dÃ¢n, quáº£n lÃ½ danh má»¥c, quáº£n lÃ½ sáº£n pháº©m, quáº£n lÃ½ Ä‘Æ¡n hÃ ng vÃ  quáº£n lÃ½ kho - hÃ³a Ä‘Æ¡n kho.",
                "RiÃªng phÃ¢n há»‡ kho hÃ ng há»— trá»£ táº¡o hÃ³a Ä‘Æ¡n nháº­p kho hoáº·c xuáº¥t kho, xem chi tiáº¿t hÃ³a Ä‘Æ¡n, theo dÃµi tá»“n kho theo tá»«ng kho, cáº­p nháº­t vá»‹ trÃ­ lÆ°u, háº¡n sá»­ dá»¥ng, ngÃ y nháº­p kho, theo dÃµi cáº£nh bÃ¡o tá»“n tháº¥p vÃ  xem lá»‹ch sá»­ biáº¿n Ä‘á»™ng kho.",
                "Giao diá»‡n Ä‘Æ°á»£c thiáº¿t káº¿ theo hÆ°á»›ng rÃµ vai trÃ² sá»­ dá»¥ng, táº­p trung vÃ o kháº£ nÄƒng thao tÃ¡c nhanh trÃªn desktop vÃ  báº£o Ä‘áº£m luá»“ng nghiá»‡p vá»¥ xuyÃªn suá»‘t giá»¯a khÃ¡ch hÃ ng, nÃ´ng dÃ¢n vÃ  quáº£n trá»‹ viÃªn."
            });

            ReplaceBetweenParagraphIndices(body, 281, 392, new[]
            {
                "3.4.1 UC-01: ÄÄƒng kÃ½ / ÄÄƒng nháº­p",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Cho phÃ©p ngÆ°á»i dÃ¹ng táº¡o tÃ i khoáº£n má»›i hoáº·c Ä‘Äƒng nháº­p Ä‘á»ƒ sá»­ dá»¥ng há»‡ thá»‘ng.",
                "Äiá»u kiá»‡n tiÃªn quyáº¿t: NgÆ°á»i dÃ¹ng chÆ°a Ä‘Äƒng nháº­p.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng truy cáº­p trang Ä‘Äƒng nháº­p hoáº·c Ä‘Äƒng kÃ½. Náº¿u Ä‘Äƒng kÃ½, ngÆ°á»i dÃ¹ng nháº­p há» tÃªn, email, sá»‘ Ä‘iá»‡n thoáº¡i, máº­t kháº©u vÃ  chá»n vai trÃ². Há»‡ thá»‘ng kiá»ƒm tra tÃ­nh há»£p lá»‡ cá»§a dá»¯ liá»‡u, táº¡o tÃ i khoáº£n vÃ  cho phÃ©p Ä‘Äƒng nháº­p.",
                "Luá»“ng ngoáº¡i lá»‡: Email Ä‘Ã£ tá»“n táº¡i, dá»¯ liá»‡u khÃ´ng há»£p lá»‡ hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng.",
                "Háº­u Ä‘iá»u kiá»‡n: NgÆ°á»i dÃ¹ng Ä‘Æ°á»£c xÃ¡c thá»±c vÃ  chuyá»ƒn Ä‘áº¿n khu vá»±c tÆ°Æ¡ng á»©ng theo vai trÃ².",

                "3.4.2 UC-02: Quáº£n lÃ½ thÃ´ng tin cÃ¡ nhÃ¢n",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Cáº­p nháº­t há» tÃªn, sá»‘ Ä‘iá»‡n thoáº¡i, Ä‘á»‹a chá»‰ vÃ  thay Ä‘á»•i máº­t kháº©u.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng vÃ o trang há»“ sÆ¡ cÃ¡ nhÃ¢n, chá»‰nh sá»­a thÃ´ng tin liÃªn há»‡ hoáº·c thay Ä‘á»•i máº­t kháº©u. Há»‡ thá»‘ng lÆ°u láº¡i dá»¯ liá»‡u má»›i sau khi kiá»ƒm tra há»£p lá»‡.",
                "Luá»“ng ngoáº¡i lá»‡: Máº­t kháº©u cÅ© khÃ´ng Ä‘Ãºng hoáº·c dá»¯ liá»‡u nháº­p vÃ o khÃ´ng há»£p lá»‡.",
                "Háº­u Ä‘iá»u kiá»‡n: ThÃ´ng tin tÃ i khoáº£n Ä‘Æ°á»£c cáº­p nháº­t trÃªn há»‡ thá»‘ng.",

                "3.4.3 UC-03: Cáº­p nháº­t Ä‘á»‹a chá»‰ giao hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Cáº­p nháº­t Ä‘á»‹a chá»‰ giao hÃ ng dÃ¹ng khi Ä‘áº·t Ä‘Æ¡n.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng nháº­p hoáº·c chá»‰nh sá»­a Ä‘á»‹a chá»‰ trong há»“ sÆ¡ cÃ¡ nhÃ¢n hoáº·c táº¡i bÆ°á»›c xÃ¡c nháº­n Ä‘Æ¡n hÃ ng. Há»‡ thá»‘ng lÆ°u láº¡i Ä‘á»‹a chá»‰ Ä‘á»ƒ sá»­ dá»¥ng cho láº§n mua tiáº¿p theo.",
                "Háº­u Ä‘iá»u kiá»‡n: Äá»‹a chá»‰ giao hÃ ng hiá»‡n táº¡i Ä‘Æ°á»£c lÆ°u trong há»“ sÆ¡ ngÆ°á»i dÃ¹ng.",

                "3.4.4 UC-04: TÃ¬m kiáº¿m, lá»c vÃ  xem danh sÃ¡ch sáº£n pháº©m",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: TÃ¬m sáº£n pháº©m phÃ¹ há»£p theo nhu cáº§u mua sáº¯m.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng nháº­p tá»« khÃ³a tÃ¬m kiáº¿m hoáº·c Ã¡p dá»¥ng bá»™ lá»c theo danh má»¥c, tá»‰nh thÃ nh, khoáº£ng giÃ¡, tráº¡ng thÃ¡i cÃ²n hÃ ng vÃ  cÃ¡ch sáº¯p xáº¿p. Há»‡ thá»‘ng tráº£ vá» danh sÃ¡ch sáº£n pháº©m tÆ°Æ¡ng á»©ng.",
                "Háº­u Ä‘iá»u kiá»‡n: NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ tiáº¿p tá»¥c má»Ÿ trang chi tiáº¿t cá»§a tá»«ng sáº£n pháº©m.",

                "3.4.5 UC-05: Xem chi tiáº¿t sáº£n pháº©m",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Xem thÃ´ng tin chi tiáº¿t cá»§a má»™t sáº£n pháº©m cá»¥ thá»ƒ.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng má»Ÿ trang chi tiáº¿t sáº£n pháº©m tá»« danh sÃ¡ch. Há»‡ thá»‘ng hiá»ƒn thá»‹ hÃ¬nh áº£nh, mÃ´ táº£, giÃ¡ bÃ¡n, Ä‘Æ¡n vá»‹ tÃ­nh, tá»“n kho, thÃ´ng tin nÃ´ng tráº¡i, Ä‘iá»ƒm Ä‘Ã¡nh giÃ¡ vÃ  cÃ¡c sáº£n pháº©m liÃªn quan.",
                "Háº­u Ä‘iá»u kiá»‡n: NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ quyáº¿t Ä‘á»‹nh thÃªm vÃ o giá» hoáº·c mua ngay.",

                "3.4.6 UC-06: ThÃªm sáº£n pháº©m vÃ o giá» hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: LÆ°u sáº£n pháº©m vÃ o giá» Ä‘á»ƒ chuáº©n bá»‹ Ä‘áº·t hÃ ng.",
                "Luá»“ng chÃ­nh: Tá»« danh sÃ¡ch sáº£n pháº©m hoáº·c trang chi tiáº¿t, ngÆ°á»i dÃ¹ng chá»n sá»‘ lÆ°á»£ng rá»“i thÃªm vÃ o giá» hÃ ng. Há»‡ thá»‘ng kiá»ƒm tra tá»“n kho trÆ°á»›c khi ghi nháº­n.",
                "Luá»“ng ngoáº¡i lá»‡: Sáº£n pháº©m Ä‘Ã£ háº¿t hÃ ng hoáº·c sá»‘ lÆ°á»£ng yÃªu cáº§u vÆ°á»£t quÃ¡ tá»“n kho.",
                "Háº­u Ä‘iá»u kiá»‡n: Giá» hÃ ng Ä‘Æ°á»£c cáº­p nháº­t vá»›i sáº£n pháº©m má»›i.",

                "3.4.7 UC-07: Quáº£n lÃ½ giá» hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Kiá»ƒm tra vÃ  Ä‘iá»u chá»‰nh cÃ¡c sáº£n pháº©m trong giá» hÃ ng.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng vÃ o trang giá» hÃ ng Ä‘á»ƒ thay Ä‘á»•i sá»‘ lÆ°á»£ng, xÃ³a tá»«ng sáº£n pháº©m hoáº·c xÃ³a toÃ n bá»™ giá». Há»‡ thá»‘ng tÃ­nh láº¡i táº¡m tÃ­nh, phÃ­ váº­n chuyá»ƒn vÃ  tá»•ng cá»™ng.",
                "Háº­u Ä‘iá»u kiá»‡n: Giá» hÃ ng pháº£n Ã¡nh Ä‘Ãºng cÃ¡c máº·t hÃ ng mÃ  ngÆ°á»i dÃ¹ng muá»‘n mua.",

                "3.4.8 UC-08: Äáº·t hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Táº¡o Ä‘Æ¡n hÃ ng má»›i tá»« giá» hÃ ng hiá»‡n táº¡i.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng chuyá»ƒn tá»« bÆ°á»›c giá» hÃ ng sang bÆ°á»›c xÃ¡c nháº­n Ä‘Æ¡n, nháº­p Ä‘á»‹a chá»‰ giao hÃ ng, ghi chÃº vÃ  chá»n phÆ°Æ¡ng thá»©c thanh toÃ¡n. Sau khi xÃ¡c nháº­n, há»‡ thá»‘ng táº¡o Ä‘Æ¡n hÃ ng vÃ  xÃ³a giá» hÃ ng hiá»‡n táº¡i.",
                "Luá»“ng ngoáº¡i lá»‡: Giá» hÃ ng trá»‘ng hoáº·c Ä‘á»‹a chá»‰ giao hÃ ng bá»‹ bá» trá»‘ng.",
                "Háº­u Ä‘iá»u kiá»‡n: Má»™t Ä‘Æ¡n hÃ ng má»›i Ä‘Æ°á»£c táº¡o trÃªn há»‡ thá»‘ng.",

                "3.4.9 UC-09: Ghi nháº­n phÆ°Æ¡ng thá»©c thanh toÃ¡n",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Chá»n phÆ°Æ¡ng thá»©c thanh toÃ¡n khi táº¡o Ä‘Æ¡n hÃ ng.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng chá»n má»™t trong hai hÃ¬nh thá»©c lÃ  tiá»n máº·t khi nháº­n hÃ ng hoáº·c VNPay. Há»‡ thá»‘ng ghi nháº­n lá»±a chá»n nÃ y vÃ o Ä‘Æ¡n hÃ ng Ä‘á»ƒ phá»¥c vá»¥ xá»­ lÃ½ nghiá»‡p vá»¥.",
                "LÆ°u Ã½: á»ž phiÃªn báº£n hiá»‡n táº¡i, há»‡ thá»‘ng má»›i ghi nháº­n phÆ°Æ¡ng thá»©c thanh toÃ¡n trÃªn giao diá»‡n vÃ  trong cÆ¡ sá»Ÿ dá»¯ liá»‡u, chÆ°a tÃ­ch há»£p cá»•ng thanh toÃ¡n VNPay thá»±c táº¿.",
                "Háº­u Ä‘iá»u kiá»‡n: ÄÆ¡n hÃ ng lÆ°u Ä‘Ãºng phÆ°Æ¡ng thá»©c thanh toÃ¡n mÃ  ngÆ°á»i dÃ¹ng Ä‘Ã£ chá»n.",

                "3.4.10 UC-10: Xem danh sÃ¡ch Ä‘Æ¡n hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Theo dÃµi cÃ¡c Ä‘Æ¡n hÃ ng Ä‘Ã£ phÃ¡t sinh.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng truy cáº­p trang Ä‘Æ¡n hÃ ng cá»§a tÃ´i. Há»‡ thá»‘ng hiá»ƒn thá»‹ danh sÃ¡ch Ä‘Æ¡n hÃ ng theo thá»i gian táº¡o, tráº¡ng thÃ¡i vÃ  tá»•ng thanh toÃ¡n.",
                "Háº­u Ä‘iá»u kiá»‡n: NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ chá»n má»™t Ä‘Æ¡n cá»¥ thá»ƒ Ä‘á»ƒ xem chi tiáº¿t.",

                "3.4.11 UC-11: Xem chi tiáº¿t vÃ  theo dÃµi tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Theo dÃµi tiáº¿n trÃ¬nh xá»­ lÃ½ cá»§a má»™t Ä‘Æ¡n hÃ ng cá»¥ thá»ƒ.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng má»Ÿ chi tiáº¿t má»™t Ä‘Æ¡n hÃ ng. Há»‡ thá»‘ng hiá»ƒn thá»‹ danh sÃ¡ch sáº£n pháº©m, tá»•ng tiá»n, phÃ­ váº­n chuyá»ƒn, Ä‘á»‹a chá»‰ giao nháº­n, ghi chÃº vÃ  tráº¡ng thÃ¡i xá»­ lÃ½ nhÆ° chá» xÃ¡c nháº­n, Ä‘Ã£ xÃ¡c nháº­n, Ä‘ang giao, Ä‘Ã£ giao hoáº·c Ä‘Ã£ há»§y.",
                "Háº­u Ä‘iá»u kiá»‡n: NgÆ°á»i dÃ¹ng náº¯m Ä‘Æ°á»£c tÃ¬nh tráº¡ng hiá»‡n táº¡i cá»§a Ä‘Æ¡n hÃ ng.",

                "3.4.12 UC-12: Há»§y Ä‘Æ¡n hÃ ng",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Há»§y Ä‘Æ¡n hÃ ng khi Ä‘Æ¡n cÃ²n á»Ÿ giai Ä‘oáº¡n cho phÃ©p.",
                "Luá»“ng chÃ­nh: NgÆ°á»i dÃ¹ng chá»n há»§y Ä‘Æ¡n táº¡i danh sÃ¡ch hoáº·c chi tiáº¿t Ä‘Æ¡n hÃ ng. Há»‡ thá»‘ng cho phÃ©p há»§y khi Ä‘Æ¡n Ä‘ang á»Ÿ tráº¡ng thÃ¡i chá» xÃ¡c nháº­n hoáº·c Ä‘Ã£ xÃ¡c nháº­n.",
                "Luá»“ng ngoáº¡i lá»‡: KhÃ´ng thá»ƒ há»§y náº¿u Ä‘Æ¡n hÃ ng Ä‘ang giao hoáº·c Ä‘Ã£ hoÃ n táº¥t.",
                "Háº­u Ä‘iá»u kiá»‡n: Tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng Ä‘Æ°á»£c cáº­p nháº­t thÃ nh Ä‘Ã£ há»§y.",

                "3.4.13 UC-13: ÄÃ¡nh giÃ¡ sáº£n pháº©m",
                "Actor: NgÆ°á»i mua",
                "Má»¥c tiÃªu: Gá»­i Ä‘Ã¡nh giÃ¡ cho sáº£n pháº©m sau khi Ä‘Ã£ nháº­n hÃ ng.",
                "Luá»“ng chÃ­nh: Sau khi cÃ³ Ä‘Æ¡n hÃ ng á»Ÿ tráº¡ng thÃ¡i Ä‘Ã£ giao chá»©a sáº£n pháº©m tÆ°Æ¡ng á»©ng, ngÆ°á»i dÃ¹ng vÃ o trang chi tiáº¿t sáº£n pháº©m, nháº­p sá»‘ sao vÃ  ná»™i dung nháº­n xÃ©t rá»“i gá»­i Ä‘Ã¡nh giÃ¡. Há»‡ thá»‘ng lÆ°u Ä‘Ã¡nh giÃ¡ vÃ  cáº­p nháº­t danh sÃ¡ch Ä‘Ã¡nh giÃ¡ hiá»ƒn thá»‹ cÃ´ng khai.",
                "Luá»“ng ngoáº¡i lá»‡: NgÆ°á»i dÃ¹ng chÆ°a cÃ³ Ä‘Æ¡n Ä‘Ã£ giao chá»©a sáº£n pháº©m hoáº·c Ä‘Ã£ Ä‘Ã¡nh giÃ¡ trÆ°á»›c Ä‘Ã³.",
                "Háº­u Ä‘iá»u kiá»‡n: ÄÃ¡nh giÃ¡ má»›i Ä‘Æ°á»£c ghi nháº­n trÃªn há»‡ thá»‘ng."
            });

            InsertAfterParagraphIndex(body, 259, new[]
            {
                "Tá»« sÆ¡ Ä‘á»“ use case cÃ³ thá»ƒ tháº¥y quáº£n trá»‹ viÃªn táº­p trung vÃ o cÃ¡c tÃ¡c vá»¥ Ä‘iá»u hÃ nh há»‡ thá»‘ng nhÆ° quáº£n lÃ½ tÃ i khoáº£n, kiá»ƒm duyá»‡t nÃ´ng dÃ¢n, danh má»¥c, sáº£n pháº©m, Ä‘Æ¡n hÃ ng vÃ  kho hÃ ng; trong khi nÃ´ng dÃ¢n táº­p trung vÃ o viá»‡c quáº£n lÃ½ gian hÃ ng, theo dÃµi Ä‘Æ¡n hÃ ng vÃ  cáº­p nháº­t há»“ sÆ¡ nÃ´ng tráº¡i."
            });

            SetParagraphText(body, 213, "Cáº­p nháº­t Ä‘á»‹a chá»‰ hiá»‡n táº¡i");
            SetParagraphText(body, 217, "TÃ¬m kiáº¿m, lá»c sáº£n pháº©m theo giao diá»‡n hiá»‡n cÃ³");
            SetParagraphText(body, 237, "Ghi nháº­n phÆ°Æ¡ng thá»©c tiá»n máº·t hoáº·c VNPay");
            SetParagraphText(body, 241, "Xem cÃ¡c Ä‘Æ¡n hÃ ng Ä‘Ã£ Ä‘áº·t");
            SetParagraphText(body, 249, "Há»§y Ä‘Æ¡n á»Ÿ tráº¡ng thÃ¡i cho phÃ©p");

            ReplaceBetweenParagraphIndices(body, 181, 195, new[]
            {
                "Há»‡ thá»‘ng hiá»‡n cÃ³ ba nhÃ³m tÃ¡c nhÃ¢n chÃ­nh lÃ  ngÆ°á»i mua, nÃ´ng dÃ¢n vÃ  quáº£n trá»‹ viÃªn.",
                "NgÆ°á»i mua lÃ  tÃ¡c nhÃ¢n sá»­ dá»¥ng cÃ¡c chá»©c nÄƒng á»Ÿ phÃ­a khÃ¡ch hÃ ng nhÆ° Ä‘Äƒng kÃ½, Ä‘Äƒng nháº­p, xem sáº£n pháº©m, thÃªm vÃ o giá» hÃ ng, Ä‘áº·t hÃ ng, theo dÃµi Ä‘Æ¡n hÃ ng, cáº­p nháº­t há»“ sÆ¡ cÃ¡ nhÃ¢n vÃ  gá»­i Ä‘Ã¡nh giÃ¡ sau khi Ä‘Ã£ nháº­n hÃ ng.",
                "NÃ´ng dÃ¢n lÃ  tÃ¡c nhÃ¢n sá»­ dá»¥ng khu vá»±c quáº£n lÃ½ riÃªng Ä‘á»ƒ theo dÃµi tá»•ng quan hoáº¡t Ä‘á»™ng, quáº£n lÃ½ sáº£n pháº©m, cáº­p nháº­t há»“ sÆ¡ nÃ´ng tráº¡i vÃ  theo dÃµi cÃ¡c Ä‘Æ¡n hÃ ng liÃªn quan Ä‘áº¿n sáº£n pháº©m cá»§a mÃ¬nh.",
                "Quáº£n trá»‹ viÃªn lÃ  tÃ¡c nhÃ¢n cÃ³ quyá»n cao nháº¥t trong há»‡ thá»‘ng, chá»‹u trÃ¡ch nhiá»‡m quáº£n lÃ½ tÃ i khoáº£n, duyá»‡t nÃ´ng dÃ¢n, quáº£n lÃ½ danh má»¥c, sáº£n pháº©m, Ä‘Æ¡n hÃ ng vÃ  váº­n hÃ nh phÃ¢n há»‡ kho hÃ ng."
            });

            doc.MainDocumentPart.Document.Save();
        }
    }

    static void SetParagraphText(Body body, int paragraphIndex, string text)
    {
        var paragraph = body.Descendants<Paragraph>().ToList()[paragraphIndex];
        paragraph.RemoveAllChildren<Run>();
        paragraph.AppendChild(new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }

    static void ReplaceBetweenParagraphIndices(Body body, int startIndex, int endIndex, IEnumerable<string> texts)
    {
        var paragraphs = body.Descendants<Paragraph>().ToList();
        var start = paragraphs[startIndex];
        var end = paragraphs[endIndex];

        var remove = new List<OpenXmlElement>();
        for (OpenXmlElement node = start.NextSibling(); node != null && node != end; node = node.NextSibling())
        {
            remove.Add(node);
        }

        foreach (var node in remove) node.Remove();
        foreach (var text in texts) end.InsertBeforeSelf(CreateParagraph(text));
    }

    static void InsertAfterParagraphIndex(Body body, int paragraphIndex, IEnumerable<string> texts)
    {
        var paragraphs = body.Descendants<Paragraph>().ToList();
        OpenXmlElement cursor = paragraphs[paragraphIndex];
        foreach (var text in texts)
        {
            var paragraph = CreateParagraph(text);
            cursor.InsertAfterSelf(paragraph);
            cursor = paragraph;
        }
    }

    static Paragraph CreateParagraph(string text)
    {
        return new Paragraph(
            new Run(
                new Text(text) { Space = SpaceProcessingModeValues.Preserve }
            )
        );
    }
}
'@

[void][Reflection.Assembly]::LoadFrom($openXmlDll)
Add-Type -TypeDefinition $code -ReferencedAssemblies @($openXmlDll, 'WindowsBase')
[ReportAligner]::Run($targetDoc)

Get-Item $targetDoc | Select-Object FullName, Length, LastWriteTime

