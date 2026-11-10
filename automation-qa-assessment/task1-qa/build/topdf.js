const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+__dirname+'/report.html');
await p.pdf({path:__dirname+'/../Task1_QA_Report_Darshan.pdf',format:'A4',printBackground:true,margin:{top:'14mm',bottom:'14mm',left:'12mm',right:'12mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;width:100%;text-align:center">Task 1 QA Report - Darshan - page <span class="pageNumber"></span>/<span class="totalPages"></span></div>'});
await b.close()})();
