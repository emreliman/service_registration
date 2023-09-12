document.addEventListener("DOMContentLoaded", calculateTotals);

function saveFormData() {
  const customer = document.getElementById("customer").value;
  const vehiclePlate = document.getElementById("vehiclePlate").value;
  const vehicleModel = document.getElementById("vehicleModel").value;
  const vehicleContact = document.getElementById("vehicleContact").value;
  const vehicleKm = document.getElementById("vehicleKm").value;
  const changeDate = document.getElementById("changeDate").value;

  const tableBody = document.querySelector(".excel-like table tbody");
  const rows = tableBody.querySelectorAll("tr");

  const records = [];
  // if customer, vehiclePlate, vehicleContact, vehicleKm, changeDate is empty, return alert
  if (
    customer === "" ||
    vehiclePlate === "" ||
    vehicleContact === "" ||
    vehicleKm === ""
  ) {
    alert("Lütfen boş alan bırakmayınız.");
    return;
  }

  rows.forEach((row) => {
    const ref = row.querySelector("td:nth-child(1) input[type='text']").value;
    const equipment = row.querySelector(
      "td:nth-child(2) input[type='text']"
    ).value;
    const equipmentCost =
      parseFloat(
        row.querySelector("td:nth-child(3) input[type='number']").value
      ) || 0;
    const labor = row.querySelector("td:nth-child(4) input[type='text']").value;
    const laborCost =
      parseFloat(
        row.querySelector("td:nth-child(5) input[type='number']").value
      ) || 0;

    records.push({
      ref,
      equipment,
      equipmentCost,
      labor,
      laborCost,
    });
  });
  const operation = JSON.stringify(records);
  console.log(operation, records);
  sqlite3.connection(
    customer,
    vehiclePlate,
    vehicleModel,
    vehicleKm,
    vehicleContact,
    changeDate,
    operation
  );

  //ipcRenderer.send("save-form-data", data);
}

function openRecords() {
  ipcRenderer.send("open-records");
}

async function displayRecords() {
  const rows = await ipcRenderer.invoke("db-query", "SELECT * FROM vehicles");

  const tableBody = document.querySelector("#records-tbody");
  if (tableBody === null) {
    return;
  }
  tableBody.innerHTML = "";

  rows.forEach((row) => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${row.id}</td>
      <td>${row.customer}</td>
      <td>${row.vehiclePlate}</td>
      <td>${row.vehicleModel}</td>
      <td>${row.vehicleKm}</td>
      <td>${row.changeDate}</td>
      <td>
        <button class="btn btn-primary" onclick="editRecord(${row.id})">Düzenle</button>
        <button class="btn btn-danger" onclick="deleteRecord(${row.id})">Sil</button>
      </td>
    `;
    tableBody.appendChild(newRow);
  });
}

ipcRenderer.on("display-records", function (evt, message) {
  displayRecords(); // Returns: {'SAVED': 'File Saved'}
  console.log("display Records");
});
function backButton() {
  ipcRenderer.send("back-to-index");
}

function filterRecords() {
  const filterText = document
    .getElementById("filterInput")
    .value.trim()
    .toLowerCase();

  const tableRows = document.querySelectorAll("tbody tr");

  tableRows.forEach((row) => {
    const make = row.cells[1].textContent.toLowerCase();
    const operation = row.cells[2].textContent.toLowerCase();
    const oilChangeDate = row.cells[3].textContent.toLowerCase();

    if (
      make.includes(filterText) ||
      operation.includes(filterText) ||
      oilChangeDate.includes(filterText)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function deleteRecord(recordId) {
  const isConfirmed = confirm("Bu işlemi silmek istediğinizden emin misiniz?");

  if (isConfirmed) {
    ipcRenderer.invoke(
      "db-query",
      `DELETE FROM vehicles WHERE id = ${recordId}`
    );
  }
}

async function editRecord(recordId) {
  const record = await ipcRenderer
    .invoke("db-query", `SELECT * FROM vehicles WHERE id = ${recordId}`)
    .then((rows) => rows[0]);

  // console.log(record);
  // console.log(JSON.parse(record.operation))
  const operations = JSON.parse(record.operation);
  const tableBody = document.querySelector("#records-excel table tbody");
  const editForm = document.getElementById("editForm");
  editForm.style.display = "block";

  const customer = document.querySelector('#editForm input[name="customer"]');
  const vehiclePlate = document.querySelector(
    '#editForm input[name="vehiclePlate"]'
  );
  const changeDate = document.querySelector(
    '#editForm input[name="changeDate"]'
  );
  const vehicleModel = document.querySelector(
    '#editForm input[name="vehicleModel"]'
  );
  const vehicleKm = document.querySelector('#editForm input[name="vehicleKm"]');
  const vehicleContact = document.querySelector(
    '#editForm input[name="vehicleContact"]'
  );
  for (const i of operations) {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
    <td><input type="text" placeholder="Referans No" value="${i.ref}"></td>
    <td><input type="text" placeholder="Yedek Parça" value="${i.equipment}"></td>
    <td><input type="number" placeholder="Tutar" oninput="calculateTotals()" onfocus="calculateTotals()" value="${i.equipmentCost}"></td>
    <td><input type="text" placeholder="İşçilik İsmi" value="${i.labor}"></td>
    <td><input type="number" placeholder="İşçilik Tutarı" oninput="calculateTotals()" onfocus="calculateTotals()" value="${i.laborCost}"></td>
    <td><button class="btn btn-danger" onclick="deleteRow(this); calculateTotals();">Sil</button></td>
  `;
    tableBody.appendChild(newRow);
  }

  customer.value = record.customer;
  vehiclePlate.value = record.vehiclePlate;
  changeDate.value = record.changeDate;
  vehicleModel.value = record.vehicleModel;
  vehicleKm.value = record.vehicleKm;
  vehicleContact.value = record.vehicleContact;

  document.getElementById("editSaveButton").onclick = () => {
    const isConfirmed = confirm(
      "Bu işlemi kaydetmek istediğinizden emin misiniz?"
    );
    if (!isConfirmed) {
      return;
    }
    const customer = document.querySelector(
      '#editForm input[name="customer"]'
    ).value;
    const vehiclePlate = document.querySelector(
      '#editForm input[name="vehiclePlate"]'
    ).value;
    const changeDate = document.querySelector(
      '#editForm input[name="changeDate"]'
    ).value;
    const vehicleModel = document.querySelector(
      '#editForm input[name="vehicleModel"]'
    ).value;
    const vehicleKm = document.querySelector(
      '#editForm input[name="vehicleKm"]'
    ).value;
    const vehicleContact = document.querySelector(
      '#editForm input[name="vehicleContact"]'
    ).value;
    const rows = tableBody.querySelectorAll("tr");
    const records = [];
    rows.forEach((row) => {
      const ref = row.querySelector(
        "#editForm td:nth-child(1) input[type='text']"
      ).value;
      const equipment = row.querySelector(
        "td:nth-child(2) input[type='text']"
      ).value;
      const equipmentCost =
        parseFloat(
          row.querySelector("#editForm td:nth-child(3) input[type='number']")
            .value
        ) || 0;
      const labor = row.querySelector(
        "#editForm td:nth-child(4) input[type='text']"
      ).value;
      const laborCost =
        parseFloat(
          row.querySelector("#editForm td:nth-child(5) input[type='number']")
            .value
        ) || 0;

      records.push({
        ref,
        equipment,
        equipmentCost,
        labor,
        laborCost,
      });
    });
    const recordsJSON = JSON.stringify(records);

    ipcRenderer.invoke(
      "db-query",
      `UPDATE vehicles SET customer = '${customer}', vehiclePlate = '${vehiclePlate}', changeDate = '${changeDate}', vehicleModel = '${vehicleModel}', vehicleKm = '${vehicleKm}', vehicleContact = '${vehicleContact}', operation = '${recordsJSON}' WHERE id = ${recordId}`
    );
    editForm.style.display = "none";
    // remove all rows from table
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  };
  calculateTotals();
}

function cancelEdit() {
  const editForm = document.getElementById("editForm");
  editForm.style.display = "none";
  // remove all rows from table
  const tableBody = document.querySelector("#records-excel table tbody");
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

function addRow() {
  let tableBody = document.querySelector(".excel-like table tbody");
  if (tableBody === null) {
    tableBody = document.querySelector("#records-excel table tbody");
  }
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
  <td><input type="text" placeholder="Referans No"></td>
  <td><input type="text" placeholder="Yedek Parça"></td>
  <td><input type="number" placeholder="Tutar" oninput="calculateTotals()" onfocus="calculateTotals()"></td>
  <td><input type="text" placeholder="İşçilik İsmi"></td>
  <td><input type="number" placeholder="İşçilik Tutarı" oninput="calculateTotals()" onfocus="calculateTotals()"></td>
  <td><button class="btn btn-danger" onclick="deleteRow(this); calculateTotals();">Sil</button></td>
`;

  // const firstRow = tableBody.querySelector("tr");
  tableBody.appendChild(newRow);

  // tableBody.insertBefore(newRow, firstRow);
}

function deleteRow(button) {
  const row = button.closest("tr");
  const tableBody = row.parentNode;

  if (row !== tableBody.querySelector("tr")) {
    tableBody.removeChild(row);
  }
  calculateTotals();
}

function calculateTotals() {
  let totalLaborCost = 0;
  let totalEquipmentCost = 0;

  let tableBody = document.querySelector(".excel-like table tbody");
  if (tableBody === null) {
    tableBody = document.querySelector("#records-excel table tbody");
  }
  const rows = tableBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const equipmentCostInput = row.querySelector(
      "td:nth-child(3) input[type='number']"
    );
    const laborCostInput = row.querySelector(
      "td:nth-child(5) input[type='number']"
    );

    const equipmentCost = parseFloat(equipmentCostInput.value) || 0;
    const laborCost = parseFloat(laborCostInput.value) || 0;

    totalEquipmentCost += equipmentCost;
    totalLaborCost += laborCost;
  });
  const totalCostWithKDV =
    totalEquipmentCost +
    totalLaborCost +
    (totalEquipmentCost + totalLaborCost) * 0.2;

  const totalCostWithoutKDV = totalEquipmentCost + totalLaborCost;

  document.getElementById("totalLaborCost").textContent =
    totalLaborCost.toFixed(2);
  document.getElementById("totalEquipmentCost").textContent =
    totalEquipmentCost.toFixed(2);
  document.getElementById("totalCost").textContent =
    totalCostWithKDV.toFixed(2);
  document.getElementById("totalCostWithoutKDV").textContent =
    totalCostWithoutKDV.toFixed(2);
}
