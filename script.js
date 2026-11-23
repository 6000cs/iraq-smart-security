
const SERVICES = [
  ["الشكاوى والبلاغات","✉"],["التهديدات والابتزاز","⚠"],["الجرائم الإلكترونية","⌘"],
  ["المفقودون والمفقودات","⌕"],["الفساد والمخالفات","⚖"],["الأمن المجتمعي","♧"],
  ["طلبات المساعدة","＋"],["التنسيق مع الدوائر","▤"],["الاقتراحات والملاحظات","✧"],["خدمات أخرى","□"]
];

const STORE = {
  records:"iss_demo_records_v1",
  employees:"iss_demo_employees_v1",
  audit:"iss_demo_audit_v1"
};

const MANAGER_CODE = "20062006";
let currentUser = null;
let records = load(STORE.records, []);
let employees = load(STORE.employees, []);
let audit = load(STORE.audit, []);

records = records.map(r => ({
  ...r,
  archivedAt:r.archivedAt||null,
  deletedAt:r.deletedAt||null,
  completedAt:r.completedAt||null
}));

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveAll() {
  localStorage.setItem(STORE.records,JSON.stringify(records));
  localStorage.setItem(STORE.employees,JSON.stringify(employees));
  localStorage.setItem(STORE.audit,JSON.stringify(audit));
}

function escapeHTML(value) {
  return String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const page=document.getElementById(id);
  if(page) page.classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="dashboard") refreshDashboard();
}

function toggleMenu() {
  const menu=document.getElementById("moreMenu");
  menu.classList.toggle("hidden");
  document.getElementById("menuButton").setAttribute(
    "aria-expanded",String(!menu.classList.contains("hidden"))
  );
}

function closeMenu() {
  document.getElementById("moreMenu").classList.add("hidden");
  document.getElementById("menuButton").setAttribute("aria-expanded","false");
}

document.addEventListener("click",e=>{
  if(!e.target.closest(".menu-wrap")) closeMenu();
});

function renderServices() {
  const grid=document.getElementById("serviceGrid");
  grid.innerHTML=SERVICES.map(([name,icon])=>
    `<button class="service-card" onclick="startReport('${name.replace(/'/g,"\\'")}')">
      <span class="service-icon">${icon}</span><strong>${name}</strong>
    </button>`
  ).join("");

  const opts=SERVICES.map(([name])=>
    `<option value="${name}">${name}</option>`
  ).join("");

  document.getElementById("category").innerHTML=opts;
  document.getElementById("employeeDepartment").innerHTML=opts;
}

function startReport(category) {
  showPage("report");
  if(category) document.getElementById("category").value=category;
  document.getElementById("submissionResult").classList.add("hidden");
}

function nextNumber() {
  const n=Number(localStorage.getItem("iss_demo_counter")||"0")+1;
  localStorage.setItem("iss_demo_counter",String(n));
  return "ISS-"+String(n).padStart(6,"0");
}

function addAudit(action) {
  audit.unshift({
    action,
    by:currentUser?.name||"المواطن (تجريبي)",
    at:new Date().toLocaleString("ar-IQ")
  });
  audit=audit.slice(0,200);
  saveAll();
}

document.getElementById("citizenForm").addEventListener("submit",e=>{
  e.preventDefault();

  if(!document.getElementById("demoConfirm").checked) return;

  const data=new FormData(e.currentTarget);
  const number=nextNumber();

  const record={
    number,
    category:data.get("category"),
    subject:data.get("subject").trim(),
    details:data.get("details").trim(),
    contact:data.get("contact").trim(),
    status:"جديد",
    assignedTo:"",
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    archivedAt:null,
    deletedAt:null,
    completedAt:null
  };

  records.unshift(record);
  saveAll();

  const box=document.getElementById("submissionResult");
  box.innerHTML=`
    <h3>تم إنشاء طلب تجريبي بنجاح</h3>
    <p>رقم المتابعة الخاص بك:</p>
    <div class="result-number">${number}</div>
    <p>احتفظ بهذا الرقم للمتابعة من نفس المتصفح والجهاز.</p>
    <button class="btn btn-navy" onclick="copyText('${number}')">نسخ رقم المتابعة</button>
  `;
  box.classList.remove("hidden");
  e.currentTarget.reset();
});

document.getElementById("trackForm").addEventListener("submit",e=>{
  e.preventDefault();

  const number=document.getElementById("trackNumber").value.trim().toUpperCase();
  const r=records.find(x=>x.number===number&&!x.deletedAt);
  const box=document.getElementById("trackResult");

  if(!r) {
    box.innerHTML="<h3>لم نعثر على الطلب</h3><p>تأكد من رقم المتابعة، واستخدم نفس المتصفح الذي أُنشئ فيه الطلب التجريبي.</p>";
  } else {
    box.innerHTML=`
      <h3>تفاصيل الطلب</h3>
      <div class="result-number">${escapeHTML(r.number)}</div>
      <p><b>القسم:</b> ${escapeHTML(r.category)}</p>
      <p><b>العنوان:</b> ${escapeHTML(r.subject)}</p>
      <p><b>الحالة:</b> <span class="status ${statusClass(r.status)}">${escapeHTML(r.status)}</span></p>
      <p><b>آخر تحديث:</b> ${new Date(r.updatedAt).toLocaleString("ar-IQ")}</p>
    `;
  }

  box.classList.remove("hidden");
});

function copyText(t) {
  if(navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(t).then(()=>alert("تم نسخ الرقم"));
  } else {
    alert("رقم المتابعة: "+t);
  }
}

document.getElementById("loginRole").addEventListener("change",()=>{
  const isEmployee=document.getElementById("loginRole").value==="employee";
  document.getElementById("employeeUserRow").classList.toggle("hidden",!isEmployee);
  document.getElementById("loginHint").textContent=isEmployee
    ?"استخدم اسم المستخدم وكلمة المرور التي أنشأها المدير."
    :"رمز المدير التجريبي: 20062006";
});

document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();

  const role=document.getElementById("loginRole").value;
  const pass=document.getElementById("loginPassword").value;
  const msg=document.getElementById("loginMessage");
  msg.textContent="";

  if(role==="manager") {
    if(pass!==MANAGER_CODE) {
      msg.textContent="رمز الدخول غير صحيح.";
      return;
    }
    currentUser={role:"manager",username:"admin",name:"المدير"};
  } else {
    const username=document.getElementById("loginUsername").value.trim();
    const emp=employees.find(x=>
      x.username===username&&x.password===pass&&x.active!==false
    );

    if(!emp) {
      msg.textContent="بيانات الموظف غير صحيحة أو الحساب غير مفعل.";
      return;
    }

    currentUser={
      role:"employee",
      username:emp.username,
      name:emp.name,
      department:emp.department
    };
  }

  addAudit("تسجيل دخول إلى لوحة الإدارة");
  e.currentTarget.reset();

  document.getElementById("loginRole").value="manager";
  document.getElementById("employeeUserRow").classList.add("hidden");
  document.getElementById("loginHint").textContent="رمز المدير التجريبي: 20062006";

  showPage("dashboard");
});

function logout() {
  if(currentUser) addAudit("تسجيل خروج");
  currentUser=null;
  showPage("home");
}

function showAdminSection(section) {
  document.querySelectorAll(".admin-section").forEach(x=>x.classList.remove("active"));
  document.getElementById("admin-"+section)?.classList.add("active");

  document.querySelectorAll(".side-link").forEach(x=>
    x.classList.toggle("selected",x.dataset.section===section)
  );

  if(["archive","trash","backup","employees","audit"].includes(section)
    &&currentUser?.role!=="manager") {
    showAdminSection("overview");
    return;
  }

  if(section==="requests") renderAdminRequests();
  if(section==="archive") renderArchive();
  if(section==="trash") renderTrash();
  if(section==="employees") renderEmployees();
  if(section==="audit") renderAudit();
  if(section==="analytics") renderAnalytics();
  if(section==="performance") renderPerformance();
  if(section==="assistant") renderAssistantChoices();
}

function visibleRecords() {
  return (currentUser?.role==="manager"
    ?records
    :records.filter(r=>r.assignedTo===currentUser?.username)
  ).filter(r=>!r.archivedAt&&!r.deletedAt);
}

function managerOnly() {
  if(currentUser?.role!=="manager") {
    alert("هذه الصلاحية متاحة للمدير حصراً.");
    return false;
  }
  return true;
}

function statusClass(s) {
  return s==="مكتمل"?"done":s==="قيد المراجعة"?"review":"";
}

function recordCard(r,controls=false) {
  let extra="";

  if(controls&&currentUser.role==="manager") {
    const assignOptions=
      `<option value="">غير محال</option>`+
      employees.filter(e=>e.active!==false).map(e=>
        `<option value="${escapeHTML(e.username)}" ${r.assignedTo===e.username?"selected":""}>
          ${escapeHTML(e.name)} — ${escapeHTML(e.department)}
        </option>`
      ).join("");

    extra=`
      <div class="request-controls">
        <select id="assign-${r.number}">${assignOptions}</select>
        <button onclick="assignRecord('${r.number}')">إحالة للموظف</button>
        <select id="status-${r.number}">
          <option ${r.status==="جديد"?"selected":""}>جديد</option>
          <option ${r.status==="قيد المراجعة"?"selected":""}>قيد المراجعة</option>
          <option ${r.status==="مكتمل"?"selected":""}>مكتمل</option>
        </select>
        <button onclick="changeStatus('${r.number}')">تحديث الحالة</button>
        <button class="manager-danger" onclick="archiveRecord('${r.number}')">أرشفة</button>
        <button class="manager-danger" onclick="moveToTrash('${r.number}')">حذف</button>
      </div>
    `;
  } else if(controls&&currentUser.role==="employee") {
    extra=`
      <div class="request-controls">
        <select id="status-${r.number}">
          <option ${r.status==="قيد المراجعة"?"selected":""}>قيد المراجعة</option>
          <option ${r.status==="مكتمل"?"selected":""}>مكتمل</option>
        </select>
        <button onclick="changeStatus('${r.number}')">تحديث الحالة</button>
      </div>
    `;
  }

  return `
    <article class="request-item">
      <div class="request-head">
        <div>
          <h3>${escapeHTML(r.subject)}</h3>
          <p>${escapeHTML(r.category)} · ${escapeHTML(r.number)}</p>
        </div>
        <span class="status ${statusClass(r.status)}">${escapeHTML(r.status)}</span>
      </div>
      <p>${escapeHTML(r.details)}</p>
      <div class="request-meta">
        تاريخ التقديم: ${new Date(r.createdAt).toLocaleString("ar-IQ")}
        ${r.assignedTo?"· محال إلى: "+escapeHTML(r.assignedTo):""}
      </div>
      ${extra}
    </article>
  `;
}

function renderAdminRequests() {
  const box=document.getElementById("adminRequestList");
  const q=(document.getElementById("requestSearch")?.value||"").toLowerCase();

  const list=visibleRecords().filter(r=>
    (r.number+" "+r.subject+" "+r.category).toLowerCase().includes(q)
  );

  box.innerHTML=list.length
    ?list.map(r=>recordCard(r,true)).join("")
    :'<div class="empty-state">لا توجد طلبات ظاهرة حالياً. الطلبات التجريبية التي يقدمها المواطن من هذا المتصفح ستظهر هنا.</div>';
}

function assignRecord(number) {
  if(currentUser?.role!=="manager") return;

  const r=records.find(x=>x.number===number);
  if(!r) return;

  r.assignedTo=document.getElementById("assign-"+number).value;
  r.updatedAt=new Date().toISOString();

  saveAll();
  addAudit("إحالة الطلب "+number);
  renderAdminRequests();
  renderOverview();
}

function changeStatus(number) {
  const r=records.find(x=>x.number===number);
  if(!r) return;

  if(currentUser.role==="employee"&&r.assignedTo!==currentUser.username) return;

  r.status=document.getElementById("status-"+number).value;
  r.updatedAt=new Date().toISOString();
  r.completedAt=r.status==="مكتمل"?(r.completedAt||r.updatedAt):null;

  saveAll();
  addAudit("تحديث حالة الطلب "+number+" إلى "+r.status);
  refreshDashboard();
}

function renderOverview() {
  const list=visibleRecords();

  document.getElementById("statTotal").textContent=list.length;
  document.getElementById("statNew").textContent=list.filter(r=>r.status==="جديد").length;
  document.getElementById("statReview").textContent=list.filter(r=>r.status==="قيد المراجعة").length;
  document.getElementById("statDone").textContent=list.filter(r=>r.status==="مكتمل").length;

  const allActive=records.filter(r=>!r.deletedAt);

  document.getElementById("statArchived").textContent=
    currentUser?.role==="manager"?allActive.filter(r=>r.archivedAt).length:0;

  document.getElementById("statAssigned").textContent=list.filter(r=>r.assignedTo).length;

  document.getElementById("statCompletion").textContent=
    (list.length?Math.round(list.filter(r=>r.status==="مكتمل").length/list.length*100):0)+"%";

  document.getElementById("latestRequests").innerHTML=
    list.slice(0,5).map(r=>recordCard(r,false)).join("")
    ||'<div class="empty-state">لا توجد طلبات حتى الآن.</div>';
}

function archiveRecord(number) {
  if(!managerOnly()) return;

  const r=records.find(x=>x.number===number&&!x.archivedAt&&!x.deletedAt);
  if(!r) return;

  r.archivedAt=new Date().toISOString();
  r.updatedAt=r.archivedAt;

  saveAll();
  addAudit("أرشفة الطلب "+number);
  refreshDashboard();
}

function restoreArchived(number) {
  if(!managerOnly()) return;

  const r=records.find(x=>x.number===number&&x.archivedAt&&!x.deletedAt);
  if(!r) return;

  r.archivedAt=null;
  r.updatedAt=new Date().toISOString();

  saveAll();
  addAudit("استعادة الطلب من الأرشيف "+number);
  renderArchive();
  renderOverview();
}

function moveToTrash(number) {
  if(!managerOnly()) return;

  const r=records.find(x=>x.number===number&&!x.deletedAt);
  if(!r) return;

  if(!confirm("سيُنقل الطلب إلى سلة المحذوفات. هل تريد المتابعة؟")) return;

  r.deletedAt=new Date().toISOString();
  r.updatedAt=r.deletedAt;

  saveAll();
  addAudit("نقل الطلب إلى سلة المحذوفات "+number);
  refreshDashboard();
}

function restoreFromTrash(number) {
  if(!managerOnly()) return;

  const r=records.find(x=>x.number===number&&x.deletedAt);
  if(!r) return;

  r.deletedAt=null;
  r.archivedAt=null;
  r.updatedAt=new Date().toISOString();

  saveAll();
  addAudit("استعادة الطلب من سلة المحذوفات "+number);
  renderTrash();
  renderOverview();
}

function permanentlyDelete(number) {
  if(!managerOnly()) return;

  const r=records.find(x=>x.number===number&&x.deletedAt);
  if(!r) return;

  if(!confirm("تحذير: الحذف النهائي لا يمكن التراجع عنه. هل أنت متأكد؟")) return;

  records=records.filter(x=>x.number!==number);
  saveAll();
  addAudit("حذف نهائي للطلب "+number);
  renderTrash();
  renderOverview();
}

function renderArchive() {
  if(!managerOnly()) return;

  const q=(document.getElementById("archiveSearch")?.value||"").toLowerCase();
  const list=records.filter(r=>
    r.archivedAt&&!r.deletedAt&&
    (r.number+" "+r.subject+" "+r.category).toLowerCase().includes(q)
  );

  document.getElementById("archiveList").innerHTML=list.length
    ?list.map(r=>`
      <article class="request-item">
        <div class="request-head">
          <div><h3>${escapeHTML(r.subject)}</h3><p>${escapeHTML(r.category)} · ${escapeHTML(r.number)}</p></div>
          <span class="archive-label">مؤرشف</span>
        </div>
        <p>${escapeHTML(r.details)}</p>
        <div class="request-meta">تاريخ الأرشفة: ${new Date(r.archivedAt).toLocaleString("ar-IQ")}</div>
        <div class="request-controls">
          <button onclick="restoreArchived('${r.number}')">استعادة إلى الطلبات</button>
          <button class="manager-danger" onclick="moveToTrash('${r.number}')">نقل إلى سلة المحذوفات</button>
        </div>
      </article>
    `).join("")
    :'<div class="empty-state">الأرشيف فارغ حالياً.</div>';
}

function renderTrash() {
  if(!managerOnly()) return;

  const list=records.filter(r=>r.deletedAt);

  document.getElementById("trashList").innerHTML=list.length
    ?list.map(r=>`
      <article class="request-item">
        <div class="request-head">
          <div><h3>${escapeHTML(r.subject)}</h3><p>${escapeHTML(r.category)} · ${escapeHTML(r.number)}</p></div>
          <span class="status">محذوف مؤقتاً</span>
        </div>
        <div class="request-meta">تاريخ النقل: ${new Date(r.deletedAt).toLocaleString("ar-IQ")}</div>
        <div class="request-controls">
          <button onclick="restoreFromTrash('${r.number}')">استعادة</button>
          <button class="manager-danger" onclick="permanentlyDelete('${r.number}')">حذف نهائي</button>
        </div>
      </article>
    `).join("")
    :'<div class="empty-state">سلة المحذوفات فارغة.</div>';
}

function renderAnalytics() {
  const active=visibleRecords();
  const now=new Date();

  const month=active.filter(r=>{
    const d=new Date(r.createdAt);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });

  const completed=active.filter(r=>r.status==="مكتمل"&&r.completedAt);

  const avg=completed.length
    ?Math.round(completed.reduce((s,r)=>
      s+(new Date(r.completedAt)-new Date(r.createdAt)),0
    )/completed.length/86400000*10)/10
    :null;

  document.getElementById("monthCount").textContent=month.length;
  document.getElementById("activeCount").textContent=
    active.filter(r=>["جديد","قيد المراجعة"].includes(r.status)).length;
  document.getElementById("rejectedCount").textContent=
    active.filter(r=>r.status==="مرفوض").length;
  document.getElementById("avgCompletion").textContent=
    avg===null?"—":avg+" يوم";

  const statuses=["جديد","قيد المراجعة","مكتمل","مرفوض"];

  document.getElementById("statusAnalytics").innerHTML=
    makeBars(statuses.map(s=>[s,active.filter(r=>r.status===s).length]));

  const cats=[...new Set(active.map(r=>r.category))];

  document.getElementById("categoryAnalytics").innerHTML=
    makeBars(cats.map(c=>[c,active.filter(r=>r.category===c).length]));
}

function makeBars(items) {
  const max=Math.max(1,...items.map(x=>x[1]));

  return items.length
    ?items.map(([label,value])=>`
      <div class="analytics-row">
        <span>${escapeHTML(label)}</span>
        <div class="analytics-track">
          <div class="analytics-fill" style="width:${Math.round(value/max*100)}%"></div>
        </div>
        <b>${value}</b>
      </div>
    `).join("")
    :'<div class="empty-state">لا توجد بيانات كافية.</div>';
}

function renderPerformance() {
  const list=visibleRecords();

  const allowedEmployees=currentUser?.role==="manager"
    ?employees
    :employees.filter(e=>e.username===currentUser?.username);

  const groups=[...new Set([
    ...allowedEmployees.map(e=>e.department),
    ...list.map(r=>employees.find(e=>e.username===r.assignedTo)?.department).filter(Boolean)
  ])].filter(Boolean);

  const rows=groups.map(dep=>{
    const staff=employees.filter(e=>e.department===dep).map(e=>e.username);
    const assigned=list.filter(r=>staff.includes(r.assignedTo));
    const done=assigned.filter(r=>r.status==="مكتمل").length;

    return {
      dep,
      total:assigned.length,
      done,
      rate:assigned.length?Math.round(done/assigned.length*100):0
    };
  });

  document.getElementById("performanceList").innerHTML=rows.length
    ?rows.map(x=>`
      <article class="request-item">
        <div class="request-head"><h3>${escapeHTML(x.dep)}</h3><strong>${x.rate}% إنجاز</strong></div>
        <p>المعاملات المحالة: ${x.total} · المنجزة: ${x.done} · قيد العمل: ${x.total-x.done}</p>
        <div class="analytics-track"><div class="analytics-fill" style="width:${x.rate}%"></div></div>
      </article>
    `).join("")
    :'<div class="empty-state">أضف موظفين وأحل إليهم طلبات حتى تظهر مؤشرات الأقسام.</div>';
}

function renderAssistantChoices() {
  const select=document.getElementById("assistantRecord");
  const list=visibleRecords();

  select.innerHTML=list.map(r=>
    `<option value="${escapeHTML(r.number)}">${escapeHTML(r.number)} — ${escapeHTML(r.subject)}</option>`
  ).join("");

  if(!list.length) select.innerHTML='<option value="">لا توجد طلبات</option>';

  document.getElementById("assistantResult").classList.add("hidden");
}

function analyzeSelectedRecord() {
  const r=records.find(x=>
    x.number===document.getElementById("assistantRecord").value
  );

  const box=document.getElementById("assistantResult");

  if(!r) {
    alert("لا يوجد طلب للتحليل.");
    return;
  }

  const text=(r.subject+" "+r.details).toLowerCase();

  const rules=[
    {keys:["ابتزاز","تهديد","تهديدات"],label:"طلب يتضمن كلمات مرتبطة بالتهديد أو الابتزاز"},
    {keys:["الكتروني","إلكتروني","حساب","اختراق","احتيال"],label:"طلب يتضمن كلمات مرتبطة بالخدمات أو الجرائم الإلكترونية"},
    {keys:["فساد","رشوة","مخالفة"],label:"طلب يتضمن كلمات مرتبطة بالفساد أو المخالفات"},
    {keys:["مفقود","فقدان"],label:"طلب يتضمن كلمات مرتبطة بالمفقودات"},
    {keys:["مساعدة","دعم"],label:"طلب مساعدة أو دعم"}
  ];

  const match=rules.find(rule=>rule.keys.some(k=>text.includes(k)));
  const summary=r.details.length>180?r.details.slice(0,180)+"…":r.details;

  box.innerHTML=`
    <h3>نتيجة المساعدة التجريبية</h3>
    <p><b>التصنيف المقترح:</b> ${escapeHTML(match?.label||r.category)}</p>
    <p><b>ملخص آلي مبسط:</b> ${escapeHTML(summary)}</p>
    <p><b>ملاحظة:</b> هذا اقتراح لغوي أولي يحتاج مراجعة بشرية، ولا يصنّف الأشخاص ولا يوصي بإجراء أمني.</p>
  `;

  box.classList.remove("hidden");
  addAudit("تشغيل المساعد التجريبي على الطلب "+r.number);
}

function downloadBlob(filename,content,type) {
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportBackup() {
  if(!managerOnly()) return;

  const payload={
    project:"IRAQ SMART SECURITY DEMO",
    version:2,
    exportedAt:new Date().toISOString(),
    records,
    employees,
    audit
  };

  downloadBlob(
    "iraq-smart-security-backup.json",
    JSON.stringify(payload,null,2),
    "application/json"
  );

  addAudit("تصدير نسخة احتياطية");
}

function importBackup() {
  if(!managerOnly()) return;

  const file=document.getElementById("backupFile").files[0];

  if(!file) {
    alert("اختر ملف النسخة الاحتياطية أولاً.");
    return;
  }

  const reader=new FileReader();

  reader.onload=()=>{
    try {
      const data=JSON.parse(reader.result);

      if(
        data.project!=="IRAQ SMART SECURITY DEMO"||
        !Array.isArray(data.records)||
        !Array.isArray(data.employees)||
        !Array.isArray(data.audit)
      ) throw new Error("invalid");

      if(!confirm("سيتم استبدال بيانات النموذج الحالية. هل تريد المتابعة؟")) return;

      records=data.records.map(r=>({
        ...r,
        archivedAt:r.archivedAt||null,
        deletedAt:r.deletedAt||null
      }));

      employees=data.employees;
      audit=data.audit;

      saveAll();
      addAudit("استعادة نسخة احتياطية");
      refreshDashboard();
      alert("تمت استعادة النسخة التجريبية.");
    } catch {
      alert("الملف غير صالح أو ليس نسخة من هذا المشروع.");
    }
  };

  reader.readAsText(file);
}

function exportAnalytics() {
  if(!managerOnly()) return;

  const rows=[[
    "رقم الطلب","القسم","الحالة","تاريخ الإنشاء","تاريخ الإنجاز","الموظف المحال إليه"
  ]];

  records.filter(r=>!r.deletedAt).forEach(r=>
    rows.push([
      r.number,r.category,r.status,r.createdAt,r.completedAt||"",r.assignedTo||""
    ])
  );

  const csv="\uFEFF"+rows.map(row=>
    row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")
  ).join("\n");

  downloadBlob(
    "iraq-smart-security-statistics.csv",
    csv,
    "text/csv;charset=utf-8"
  );

  addAudit("تصدير تقرير الإحصائيات");
}

document.getElementById("employeeForm").addEventListener("submit",e=>{
  e.preventDefault();

  if(currentUser?.role!=="manager") return;

  const name=document.getElementById("employeeName").value.trim();
  const department=document.getElementById("employeeDepartment").value;
  const username=document.getElementById("employeeUsername").value.trim();
  const password=document.getElementById("employeePassword").value;

  if(employees.some(x=>x.username.toLowerCase()===username.toLowerCase())) {
    alert("اسم المستخدم مستخدم مسبقاً.");
    return;
  }

  employees.push({name,department,username,password,active:true});

  saveAll();
  addAudit("إنشاء حساب موظف: "+username);
  e.currentTarget.reset();
  renderEmployees();
});

function renderEmployees() {
  const box=document.getElementById("employeeList");

  box.innerHTML=employees.map((e,i)=>`
    <article class="request-item employee-row">
      <div>
        <strong>${escapeHTML(e.name)}</strong>
        <small>${escapeHTML(e.username)} · ${escapeHTML(e.department)} · ${e.active===false?"معطل":"فعال"}</small>
      </div>
      <button class="btn btn-navy" onclick="toggleEmployee(${i})">
        ${e.active===false?"تفعيل":"تعطيل"}
      </button>
    </article>
  `).join("")||'<div class="empty-state">لم تتم إضافة موظفين بعد.</div>';
}

function toggleEmployee(i) {
  if(currentUser?.role!=="manager"||!employees[i]) return;

  employees[i].active=employees[i].active===false;
  saveAll();
  addAudit("تغيير حالة حساب "+employees[i].username);
  renderEmployees();
}

function renderAudit() {
  document.getElementById("auditList").innerHTML=audit.map(a=>`
    <div class="audit-line">
      <b>${escapeHTML(a.action)}</b><br>
      ${escapeHTML(a.by)} · ${escapeHTML(a.at)}
    </div>
  `).join("")||'<div class="empty-state">لا توجد عمليات مسجلة.</div>';
}

function refreshDashboard() {
  if(!currentUser) {
    showPage("staffLogin");
    return;
  }

  document.getElementById("welcomeText").textContent=
    `مرحباً ${currentUser.name} — ${
      currentUser.role==="manager"?"مدير النظام":"موظف · "+currentUser.department
    }`;

  document.querySelectorAll(".manager-only").forEach(el=>
    el.classList.toggle("hidden",currentUser.role!=="manager")
  );

  renderOverview();
  renderAdminRequests();

  if(currentUser.role==="manager") {
    renderEmployees();
    renderAudit();
    renderArchive();
    renderTrash();
  }

  renderAnalytics();
  renderPerformance();
  renderAssistantChoices();

  if(
    currentUser.role==="employee"&&
    ["employees","audit","archive","trash","backup"].includes(
      document.querySelector(".admin-section.active")?.id?.replace("admin-","")
    )
  ) {
    showAdminSection("overview");
  }
}

renderServices();
showPage("home");
