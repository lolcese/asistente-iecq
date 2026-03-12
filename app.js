document.addEventListener("DOMContentLoaded", () => {
  const steps = {
    parciales: document.getElementById("step-parciales"),
    final1: document.getElementById("step-final-1"),
    final2: document.getElementById("step-final-2"),
    result: document.getElementById("step-result"),
  };

  let studentState = {
    condition: "",
    p1: 0,
    p2: 0,
    failedPart: 0,
    wasRegularBeforeRecu: false,
    canRecoverPromotion: false,
    canRecoverRegularity: false
  };

  const showStep = (stepId) => {
    Object.values(steps).forEach((s) => s.classList.remove("active"));
    steps[stepId].classList.add("active");
  };

  const updateBadge = (elId, text, type) => {
    const badge = document.getElementById(elId);
    if (!badge) return;
    badge.innerText = text;
    badge.classList.remove("success", "danger", "warning");
    if (type === "success") badge.classList.add("success");
    else if (type === "danger") badge.classList.add("danger");
    else if (type === "warning") badge.classList.add("warning");
  };

  const syncAllBadges = (stepSuffix, condition, status, statusType) => {
    const condBadge = document.getElementById(`badge-cond-${stepSuffix}`);
    const statBadge = document.getElementById(`badge-stat-${stepSuffix}`);
    
    // Si ya aprobó o promocionó, no mostramos la condición previa (Libre/Regular)
    if (status === "APROBADO" || status === "PROMOCIONADO") {
      if (condBadge) condBadge.style.display = "none";
    } else {
      if (condBadge) condBadge.style.display = "inline-block";
    }

    let condType = condition.includes("REGULAR") ? "success" : "danger";
    if (condition.includes("RECUP")) condType = "warning";
    
    let statusText = status;
    let finalStatusType = statusType;

    if (condition.includes("RECUP") && status === "NO APROBADO") {
      statusText = "NO APROBADO (CON RECUP.)";
      finalStatusType = "warning";
    }

    updateBadge(`badge-cond-${stepSuffix}`, condition, condType);
    updateBadge(`badge-stat-${stepSuffix}`, statusText, finalStatusType);
  };

  const showResult = (title, condition, description, type = "success") => {
    const titleEl = document.getElementById("result-title");
    const descEl = document.getElementById("result-description");
    const labels = { success: "APROBADO", danger: "NO APROBADO" };

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

  const C_FINAL = "un 4 (14/26 respuestas correctas)";
  const C_RECU_PROM = "un 6 (15/26 respuestas correctas, donde 4 equivale a 12/26)";
  const C_RECU_REG = "6/13 respuestas correctas de la parte correspondiente";

  const LIBRE_DEF = `• <strong style="color: #ef4444;">Condición Libre:</strong> No podés cursar ni rendir las materias de primer año hasta aprobar IECQ.<br><em>El examen final se aprueba con ${C_FINAL}.</em>`;
  const REGULAR_DEF = `• <strong style="color: #10b981;">Condición Regular:</strong> Podés cursar las materias de primer año, pero NO rendirlas ni promocionarlas hasta aprobar IECQ.<br><em>El examen final se aprueba con ${C_FINAL}.</em>`;
  const APROBADO_DEF = `• Podés cursar, promocionar y rendir las materias de primer año.<br><br><strong>¡Ya podés inscribirte a las materias de primer año!</strong>`;

  const typeSelect = document.getElementById("f1_type");
  const labelF1 = document.getElementById("label-f1");
  const recuRegField = document.getElementById("field-recu-reg");
  const regReminder = document.getElementById("reg-reminder-f1");

  const updateRegistrationInfo = () => {
    const isVisible = document.getElementById("field-type-f1").style.display !== "none";
    const dangerIcon = `<span style="font-size: 1.2rem;">⚠️</span>`;
    
    if (!isVisible) {
      regReminder.innerHTML = `${dangerIcon} <strong>Para rendir el primer examen final, tenés que inscribirte en SIU-Guaraní en las fechas indicadas.</strong>`;
      regReminder.style.background = "#fef2f2";
      regReminder.style.color = "#991b1b";
      regReminder.style.borderLeftColor = "#ef4444";
      regReminder.style.display = "flex";
      return;
    }

    if (typeSelect.value === "final") {
      regReminder.innerHTML = `${dangerIcon} <strong>Para rendir el primer examen final, tenés que inscribirte en SIU-Guaraní en las fechas indicadas.</strong>`;
      regReminder.style.background = "#fef2f2";
      regReminder.style.color = "#991b1b";
      regReminder.style.borderLeftColor = "#ef4444";
      regReminder.style.display = "flex";
    } else {
      regReminder.innerHTML = `<em>El recuperatorio de promoción NO requiere inscripción previa.</em>`;
      regReminder.style.background = "#f8fafc";
      regReminder.style.color = "#475569";
      regReminder.style.borderLeftColor = "#e2e8f0";
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
      document.getElementById("msg-f1").innerHTML = `<p>Tu asistencia es inferior al 80%. En esta condición, no podés recuperar la regularidad mediante examen parcial.<br><br>${LIBRE_DEF}<br><br>Tu única opción es rendir el examen final completo.</p>`;
      document.getElementById("field-type-f1").style.display = "none";
      recuRegField.style.display = "none";
      labelF1.innerText = "Nota obtenida en el primer examen final";
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
      showResult("¡PROMOCIONASTE!", "REGULAR", `¡Excelente desempeño!<br><br>${APROBADO_DEF}`, "success");
      return;
    }

    if (r1 === "F" || r2 === "F") {
      studentState.failedPart = (r1 === "F") ? 1 : 2;
      if (hasSixPlus) {
        studentState.condition = "LIBRE (CON RECUP.)";
        document.getElementById("msg-f1").innerHTML = `<p>Tenés dos opciones para tu primera fecha de examen:<br><br>
        1. **Recuperatorio de promoción** del parcial ${studentState.failedPart}: para intentar recuperar la regularidad y la promoción (se aprueba con ${C_RECU_PROM}).<br>
        2. **Examen Final Completo**: para intentar aprobar la materia (se aprueba con ${C_FINAL}) o recuperar la regularidad (se aprueba con ${C_RECU_REG}).</p>`;
      } else {
        studentState.condition = "LIBRE";
        let txt = `<p>${LIBRE_DEF}<br><br>`;
        if (studentState.canRecoverRegularity) txt += `<strong>Opción de Regularidad:</strong> Al tener al menos un 4+, en tu primera fecha de final podés intentar recuperar la regularidad aprobando con ${C_RECU_REG}.<br><br>`;
        else txt += `Tu única opción es el examen final completo ya que no contás con parciales aprobados con 4 o más.`;
        txt += `</p>`;
        document.getElementById("msg-f1").innerHTML = txt;
      }
    } else {
      studentState.condition = "REGULAR";
      studentState.failedPart = (studentState.p1 < 6) ? 1 : (studentState.p2 < 6 ? 2 : 0);
      let txt = `<p>${REGULAR_DEF}<br>`;
      if (hasSixPlus) txt += `<br><strong>Opcional:</strong> Tenés la posibilidad de rendir el recuperatorio de promoción (con ${C_RECU_PROM}) para promocionar.</p>`;
      document.getElementById("msg-f1").innerHTML = txt;
    }

    syncAllBadges("f1", studentState.condition, "NO APROBADO", "danger");
    document.getElementById("title-f1").innerText = studentState.canRecoverPromotion ? "Recuperatorio promoción o primer examen final" : "Primer examen final";
    document.getElementById("field-type-f1").style.display = studentState.canRecoverPromotion ? "block" : "none";
    labelF1.innerText = studentState.canRecoverPromotion ? `Nota obtenida en ${typeSelect.options[typeSelect.selectedIndex].text}` : "Nota obtenida en el primer examen final";
    
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
        showResult("¡APROBASTE!", studentState.condition.includes("REGULAR") ? "REGULAR" : "LIBRE", `Felicitaciones, aprobaste IECQ.<br><br>${APROBADO_DEF}`, "success");
        return;
      }
      if (examType === "final" && recuperoReg) {
        studentState.condition = "REGULAR";
        document.getElementById("msg-f2").innerHTML = `<strong>¡Regularidad recuperada!</strong> Aprobaste con ${C_RECU_REG}. Te queda una instancia de examen final.<br><br>${REGULAR_DEF}`;
      } else {
        document.getElementById("msg-f2").innerHTML = `No lograste aprobar ni recuperar regularidad. Te queda el segundo examen final.<br><br>${studentState.condition.includes("REGULAR") ? REGULAR_DEF : LIBRE_DEF}`;
      }
    } 
    else {
      if (studentState.failedPart === 1) studentState.p1 = nota1; else studentState.p2 = nota1;
      if (getRange(studentState.p1) === "P" && getRange(studentState.p2) === "P") {
        showResult("¡PROMOCIONASTE!", "REGULAR", `Excelente desempeño. Lograste la promoción.<br><br>${APROBADO_DEF}`, "success");
        return;
      }
      if (getRange(studentState.p1) !== "F" && getRange(studentState.p2) !== "F") {
        studentState.condition = "REGULAR";
        document.getElementById("msg-f2").innerHTML = `No lograste la promoción, pero ahora sos alumno regular. Podés rendir el segundo examen final.<br><br>${REGULAR_DEF}`;
      } else {
        studentState.condition = "LIBRE";
        document.getElementById("msg-f2").innerHTML = `No lograste recuperar la regularidad. Seguís en condición de alumno libre.<br><br>${LIBRE_DEF}`;
      }
    }

    syncAllBadges("f2", studentState.condition, "NO APROBADO", "danger");
    document.getElementById("label-f2").innerText = "Nota obtenida en el segundo examen final";
    showStep("final2");
  });

  document.getElementById("btn-calc-final-2").addEventListener("click", () => {
    const nota2 = parseInt(document.getElementById("f2_val").value) || 0;
    if (nota2 >= 4) {
      showResult("¡APROBASTE!", studentState.condition, `Completaste la materia con éxito.<br><br>${APROBADO_DEF}`, "success");
    } else {
      showResult("NO APROBADO", studentState.condition, `No lograste aprobar la materia en esta instancia final.<br><br>${studentState.condition.includes("REGULAR") ? REGULAR_DEF : LIBRE_DEF}`, "danger");
    }
  });

  // Validation: Only allow integers between 0 and 10
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', (e) => {
      let val = e.target.value;
      if (val !== "") {
        let n = Math.floor(Number(val));
        if (n < 0) n = 0;
        if (n > 10) n = 10;
        if (val != n) e.target.value = n;
      }
    });
  });
});
