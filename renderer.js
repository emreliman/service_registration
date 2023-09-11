document.addEventListener("DOMContentLoaded", calculateTotals);

// get oilchangedate and set to today
// var today = new Date();
// var dd = today.getDate();
// var mm = today.getMonth()+1; //January is 0 so need to add 1 to make it 1!
// var yyyy = today.getFullYear();

// document.getElementById("oilChangeDate").value = yyyy + "-" + mm + "-" + dd;

/*
async function saveFormData() {
    const vehiclePlate = document.getElementById('vehiclePlate').value
    const vehicleModel = document.getElementById('vehicleModel').value
    const vehicleYear = document.getElementById('vehicleYear').value
    const oilChangeDate = document.getElementById('oilChangeDate').value
    const oilChangeMileage = document.getElementById('oilChangeMileage').value
    const vehicleOperation = document.getElementById('vehicleOperation').value

    sqlite3.connection(vehiclePlate, vehicleModel, vehicleYear, oilChangeDate, oilChangeMileage, vehicleOperation)
}
*/

function saveFormData() {
  const customer = document.getElementById("customer").value;
  const vehiclePlate = document.getElementById("vehiclePlate").value;
  const vehicleModel = document.getElementById("vehicleModel").value;
  const vehicleContact = document.getElementById("vehicleContact").value;
  const ChangeDate = document.getElementById("ChangeDate").value;

  const tableBody = document.querySelector(".excel-like table tbody");
  const rows = tableBody.querySelectorAll("tr");

  const records = [];

  rows.forEach((row) => {
    const equipment = row.querySelector(
      "td:nth-child(1) input[type='text']"
    ).value;
    const equipmentCost =
      parseFloat(
        row.querySelector("td:nth-child(2) input[type='number']").value
      ) || 0;
    const labor = row.querySelector("td:nth-child(3) input[type='text']").value;
    const laborCost =
      parseFloat(
        row.querySelector("td:nth-child(4) input[type='number']").value
      ) || 0;

    records.push({
      equipment,
      equipmentCost,
      labor,
      laborCost,
    });
  });
  recordsJSON = JSON.stringify(records);
  sqlite3.connection(
    customer,
    vehiclePlate,
    vehicleModel,
    vehicleContact,
    ChangeDate,
    recordsJSON
  );

  //ipcRenderer.send("save-form-data", data);
}

// async function calldisplayRecords(){
//   window.onload = async function() {
//     await displayRecords();
//     console.log("hella");
//   }
// }

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
      <td>
        <button class="btn btn-primary" onclick="editRecord(${row.id})">Düzenle</button>
        <button class="btn btn-danger" onclick="deleteRecord(${row.id})">Sil</button>
      </td>
    `;
    tableBody.appendChild(newRow);
  });
}

ipcRenderer.on("asynchronous-message", function (evt, message) {
  displayRecords(); // Returns: {'SAVED': 'File Saved'}
  console.log("sa");
});
function backButton() {
  ipcRenderer.send("back-to-index");
}

// function addTaskField() {
//   // Get the parent div of the input group
//   var parentDiv = document.querySelector('.panel-body');

//   // Create a new input group
//   var newInputGroup = document.createElement('div');
//   newInputGroup.className = 'm-5';

//   // Create a new input field
//   var newInput = document.createElement('input');
//   newInput.type = 'text';
//   newInput.className = 'form-control';
//   newInput.placeholder = 'Yapılan işlem';

//   // Append the input field to the new input group
//   newInputGroup.appendChild(newInput);

//   // Append the new input group to the parent div
//   parentDiv.appendChild(newInputGroup);
// }

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

  console.log(record);

  const editForm = document.getElementById("editForm");
  editForm.style.display = "block";

  document.getElementById("editMake").value = record.customer;
  document.getElementById("editOperation").value = record.vehiclePlate;
  document.getElementById("editOilChangeDate").value = record.vehicleModel;

  document.getElementById("editSaveButton").onclick = () => {
    const updatedMake = document.getElementById("editMake").value;
    const updatedOperation = document.getElementById("editOperation").value;
    const updatedOilChangeDate =
      document.getElementById("editOilChangeDate").value;

    ipcRenderer.invoke(
      "db-query",
      `UPDATE vehicles SET make = '${updatedMake}', operation = '${updatedOperation}', oilChangeDate = '${updatedOilChangeDate}' WHERE id = ${recordId}`
    );
  };
}

function cancelEdit() {
  const editForm = document.getElementById("editForm");
  editForm.style.display = "none";
}

function addRow() {
  const tableBody = document.querySelector(".excel-like table tbody");
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
  <td><input type="text" placeholder="Yedek Parça"></td>
  <td><input type="number" placeholder="Tutar" oninput="calculateTotals()" onfocus="calculateTotals()"></td>
  <td><input type="text" placeholder="İşçilik İsmi"></td>
  <td><input type="number" placeholder="İşçilik Tutarı" oninput="calculateTotals()" onfocus="calculateTotals()"></td>
  <td><button onclick="deleteRow(this); calculateTotals();">Sil</button></td>
`;

  const firstRow = tableBody.querySelector("tr");
  tableBody.insertBefore(newRow, firstRow);
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

  const tableBody = document.querySelector(".excel-like table tbody");
  const rows = tableBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const equipmentCostInput = row.querySelector(
      "td:nth-child(2) input[type='number']"
    );
    const laborCostInput = row.querySelector(
      "td:nth-child(4) input[type='number']"
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
