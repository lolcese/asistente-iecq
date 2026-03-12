document.addEventListener("DOMContentLoaded", () => {
  const steps = {
    parciales: document.getElementById("step-parciales"),
    final1: document.getElementById("step-final-1"),
    final2: document.getElementById("step-final-2"),
    result: document.getElementById("step-result"),
  };

  let studentState = {
    condition: "", // LIBRE, REGULAR, PROMOCIONADO, RECUP_REG, RECUP_PROM, RECUP_BOTH
    p1: 0,
    p2: 0,
    failedPart: 0, // 1 o 2
    wasRegularBeforeRecu: false,
    canRecoverPromotion: false,
    canRecoverRegularity: false
  };

  const showStep = (stepId) => {
    Object.values(steps).forEach((s) => s.classList.remove("active"));
    steps[stepId].classList.add("active");
  };

  const updateBadge = (elId, text, type, tooltip = "") => {
    const badge = document.getElementById(elId);
    if (!badge) return;
    badge.innerText = text;
    
    badge.classList.remove("success", "danger", "warning");
    if (type === "success") badge.classList.add("success");
    else if (type === "danger") badge.classList.add("danger");
    else if (type === "warning") badge.classList.add("warning");

    if (tooltip) {
        badge.setAttribute("data-tooltip", tooltip);
        badge.classList.add("has-tooltip");
    } else {
        badge.classList.remove("has-tooltip");
    }
  };

  const syncAllBadges = (stepSuffix, condition, status, statusType) => {
    const condType = condition.includes("REGULAR") ? "success" : "danger";
    const condTooltip = condition.includes("REGULAR") ? T_REGULAR : T_LIBRE;
    
    let statusText = status;
    if (condition.includes("RECUP") && status === "NO APROBADO") {
        statusText = "NO APROBADO (CON RECUP.)";
    }

    updateBadge(`badge-cond-${stepSuffix}`, condition, condType, condTooltip);
    updateBadge(`badge-stat-${stepSuffix}`, statusText, statusType);
  };

  const showResult = (title, condition, description, type = "success") => {
    const titleEl = document.getElementById("result-title");
    const descEl = document.getElementById("result-description");

    const labels = {
      success: "APROBADO",
      danger: "NO APROBADO",
    };

    titleEl.innerText = title;
    descEl.innerHTML = description;
    
    syncAllBadges("res", condition, labels[type], type);
    showStep("result");
  };

  const getRange = (nota) => {
    if (nota === 0 || nota < 4) return "F";
    if (nota < 6) return "R";
    return "P";
  };

  const T_LIBRE = "Libre: No podés cursar ni rendir las materias de primer año hasta aprobar IECQ.";
  const T_REGULAR = "Regular: Podés cursar las materias de primer año, pero NO rendirlas ni promocionarlas hasta aprobar IECQ.";
  const T_APROBADO = "Aprobado: Podés cursar, promocionar y rendir las materias de primer año.";

  const LIBRE_DEF = `• <strong class="has-tooltip" data-tooltip="${T_LIBRE}" style="color: #ef4444;">LIBRE: No podés cursar ni rendir</strong> las materias de primer año hasta aprobar IECQ.<br><em>(El examen final se aprueba con 4, que equivale a 14/26 correctas)</em>`;
  const REGULAR_DEF = `• <strong class="has-tooltip" data-tooltip="${T_REGULAR}" style="color: #10b981;">REGULAR: Podés cursar</strong> las materias de primer año, pero <strong>NO rendirlas ni promocionarlas</strong> hasta aprobar IECQ.<br><em>(El examen final se aprueba con 4, que equivale a 14/26 correctas)</em>`;
  const APROBADO_DEF = `• <strong class="has-tooltip" data-tooltip="${T_APROBADO}" style="color: #10b981;">APROBADO/PROMOCIÓN: Podés cursar, promocionar y rendir</strong> las materias de primer año.`;

  const typeSelect = document.getElementById("f1_type");
  const labelF1 = document.getElementById("label-f1");
  const recuRegField = document.getElementById("field-recu-reg");
  const regReminder = document.getElementById("reg-reminder-f1");

  const updateRegistrationInfo = () => {
    const isVisible = document.getElementById("field-type-f1").style.display !== "none";
    
    if (!isVisible) {
       // Si no hay selector, el alumno es LIBRE sin opción o REGULAR sin opción de recu.
       // En estos casos rendirá FINAL, así que siempre mostramos el recordatorio.
       regReminder.innerHTML = `<strong>Para rendir el examen final, tenés que inscribirte en SIU-Guaraní en las fechas indicadas.</strong>`;
       regReminder.style.display = "block";
       return;
    }

    if (typeSelect.value === "final") {
      regReminder.innerHTML = `<strong>Para rendir el examen final, tenés que inscribirte en SIU-Guaraní en las fechas indicadas.</strong>`;
      regReminder.style.display = "block";
    } else {
      regReminder.innerHTML = `<em>El recuperatorio de promoción NO requiere inscripción previa.</em>`;
      regReminder.style.display = "block";
    }
  };

  const toggleRecuRegVisibility = () => {
    const isFinal = typeSelect.value === "final";
    const needsToSaveReg = studentState.canRecoverRegularity && (getRange(studentState.p1) === "F" || getRange(studentState.p2) === "F");
    recuRegField.style.display = (isFinal && needsToSaveReg) ? "block" : "none";
  };

  typeSelect.addEventListener("change", () => {
      const typeName = typeSelect.options[typeSelect.selectedIndex].text;
      labelF1.innerText = `Nota obtenida en ${typeName}`;
      toggleRecuRegVisibility();
      updateRegistrationInfo();
  });

  document.getElementById("btn-calc-parciales").addEventListener("click", () => {
    const hasAttendance = document.getElementById("asistencia").value === "si";
    studentState.p1 = parseInt(document.getElementById("p1").value) || 0;
    studentState.p2 = parseInt(document.getElementById("p2").value) || 0;

    if (!hasAttendance) {
      studentState.condition = "LIBRE";
      syncAllBadges("f1", "LIBRE", "NO APROBADO", "danger");
      document.getElementById("msg-f1").innerHTML = `<p>• <strong>LIBRE por asistencia (< 80%).</strong><br>${LIBRE_DEF}<br><br>Al no tener la asistencia mínima, <strong>NO podés recuperar la regularidad</strong>. Tu única opción es rendir el examen final completo.</p>`;
      document.getElementById("field-type-f1").style.display = "none";
      recuRegField.style.display = "none";
      labelF1.innerText = "Nota obtenida en Examen Final";
      updateRegistrationInfo();
      showStep("final1");
      return;
    }

    const r1 = getRange(studentState.p1);
    const r2 = getRange(studentState.p2);
    const hasFourPlus = (studentState.p1 >= 4 || studentState.p2 >= 4);
    const hasSixPlus = (studentState.p1 >= 6 || studentState.p2 >= 6);
    
    studentState.wasRegularBeforeRecu = (r1 !== "F" && r2 !== "F");
    studentState.canRecoverPromotion = hasSixPlus;
    studentState.canRecoverRegularity = hasFourPlus;

    if (r1 !== "F" && r2 !== "F" && studentState.p1 >= 6 && studentState.p2 >= 6) {
        showResult("PROMOCIONASTE", "REGULAR", `¡Excelente! Al promocionar IECQ,<br><br>${APROBADO_DEF}<br><br>No tenés que rendir examen final ni realizar más trámites de inscripción.`, "success");
        return;
    }

    if (r1 === "F" || r2 === "F") {
        studentState.failedPart = (r1 === "F") ? 1 : 2;
        if (hasSixPlus) {
            studentState.condition = "LIBRE (CON RECUP.)";
            document.getElementById("msg-f1").innerHTML = `<p>Al tener un 6+, se te permite recuperar el parcial ${studentState.failedPart} para intentar <strong>recuperar la REGULARIDAD y la PROMOCIÓN</strong>.</p>`;
        } else {
            studentState.condition = "LIBRE";
            let txt = `<p>${LIBRE_DEF}<br><br>`;
            if (studentState.canRecoverRegularity) txt += `<strong>OPCIÓN EN EL 1er FINAL:</strong> Al tener al menos un 4+, podés intentar <strong>recuperar la regularidad</strong> aprobando la parte que debés (6 de 13 preguntas).<br><br>`;
            else txt += `Al no tener al menos un parcial con nota 4 o más, <strong>NO podés recuperar la regularidad</strong>. Tu única opción es rendir el examen final completo.<br><br>`;
            txt += `</p>`;
            document.getElementById("msg-f1").innerHTML = txt;
        }
    } else {
        studentState.condition = "REGULAR";
        studentState.failedPart = (studentState.p1 < 6) ? 1 : (studentState.p2 < 6 ? 2 : 0);
        let txt = `<p>${REGULAR_DEF}<br>`;
        if (hasSixPlus) txt += `<br><strong>OPCIÓN:</strong> Tenés la posibilidad de rendir el <strong>Recuperatorio de promoción</strong> para intentar promocionar ya que tenés un 6+.</p>`;
        document.getElementById("msg-f1").innerHTML = txt;
    }

    syncAllBadges("f1", studentState.condition, "NO APROBADO", "danger");
    document.getElementById("field-type-f1").style.display = studentState.canRecoverPromotion ? "block" : "none";
    labelF1.innerText = studentState.canRecoverPromotion ? `Nota obtenida en ${typeSelect.options[typeSelect.selectedIndex].text}` : "Nota obtenida en Examen Final";
    
    toggleRecuRegVisibility();
    updateRegistrationInfo();
    showStep("final1");
  });

  document.getElementById("btn-calc-final-1").addEventListener("click", () => {
    const nota1 = parseInt(document.getElementById("f1_val").value) || 0;
    const examType = document.getElementById("f1_type").value;
    const recuperoReg = document.getElementById("f1_recu_reg").value === "si";
    const canRecoverProp = studentState.canRecoverPromotion;
    
    if (!canRecoverProp || examType === "final") {
        if (nota1 >= 4) {
             showResult("APROBASTE IECQ", studentState.condition.includes("REGULAR") ? "REGULAR" : "LIBRE", `Aprobaste el examen de IECQ (con un 4 o más, equivalente a 14/26+ correctas).<br><br>${APROBADO_DEF}<br><br><strong>Ya no tenés que inscribirte para otros finales de esta materia.</strong>`, "success");
             return;
        }
        if (examType === "final" && recuperoReg) {
            studentState.condition = "REGULAR";
            document.getElementById("msg-f2").innerHTML = `<strong>Lograste recuperar la <span class="has-tooltip" data-tooltip="${T_REGULAR}" style="color: #10b981;">REGULARIDAD</span> (aprobaste la parte adeudada).</strong><br>No aprobaste el final completo. Te queda el segundo examen final.<br><br>${REGULAR_DEF}`;
        } else {
            document.getElementById("msg-f2").innerHTML = `No aprobaste el primer examen final ni recuperaste regularidad.<br><br>${studentState.condition.includes("REGULAR") ? REGULAR_DEF : LIBRE_DEF}`;
        }
    } 
    else {
        if (studentState.failedPart === 1) studentState.p1 = nota1; else studentState.p2 = nota1;
        if (getRange(studentState.p1) === "P" && getRange(studentState.p2) === "P") {
            showResult("PROMOCIONASTE", "REGULAR", `¡Excelente! Lograste la PROMOCIÓN.<br><br>${APROBADO_DEF}<br><br><strong>No tenés que realizar más trámites de inscripción.</strong>`, "success");
            return;
        }
        if (getRange(studentState.p1) !== "F" && getRange(studentState.p2) !== "F") {
            studentState.condition = "REGULAR";
            document.getElementById("msg-f2").innerHTML = `No lograste promocionar, pero quedaste <strong class="has-tooltip" data-tooltip="${T_REGULAR}" style="color: #10b981;">REGULAR</strong>. Ahora podés rendir el final en el segundo examen final.<br><br>${REGULAR_DEF}`;
        } else {
            studentState.condition = "LIBRE";
            document.getElementById("msg-f2").innerHTML = `No lograste la regularidad en el recuperatorio. Seguís <strong class="has-tooltip" data-tooltip="${T_LIBRE}" style="color: #ef4444;">LIBRE</strong>.<br><br>${LIBRE_DEF}`;
        }
    }

    syncAllBadges("f2", studentState.condition, "NO APROBADO", "danger");
    document.getElementById("label-f2").innerText = "Nota obtenida en el segundo examen final";
    showStep("final2");
  });

  document.getElementById("btn-calc-final-2").addEventListener("click", () => {
    const nota2 = parseInt(document.getElementById("f2_val").value) || 0;
    if (nota2 >= 4) {
      showResult("APROBASTE IECQ", studentState.condition, `Aprobaste el segundo examen final (con un 4 o más, equivalente a 14/26+ correctas).<br><br>${APROBADO_DEF}<br><br><strong>Ya no tenés que realizar más trámites de inscripción.</strong>`, "success");
    } else {
      showResult("NO APROBADO", studentState.condition, `No aprobaste IECQ.<br><br>${studentState.condition.includes("REGULAR") ? REGULAR_DEF : LIBRE_DEF}`, "danger");
    }
  });
});
