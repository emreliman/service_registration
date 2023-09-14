// ipcrenderer ile sqlden tüm verileri çek sonra aşağıdaki formatı kullanarak chart.js ile chart oluştur.
async function getData() {
  const priceData = await ipcRenderer.invoke(
    "db-query",
    "SELECT * FROM vehicles ORDER BY DATE(changeDate) ASC;"
  );
  return priceData;
}

// let sortedResult = {};

// // Ayları sırayla döngüye al
// months.forEach(month => {
//     // Eğer ay, sonuçta varsa, sıralı sonuca ekle
//     if (result[month]) {
//         sortedResult[month] = result[month];
//     }
// });

function backButton() {
  ipcRenderer.send("back-to-index");
}
function transformData(data) {
  // Türkçe aylar
  const months = [
    "Ocak",
    "Subat",
    "Mart",
    "Nisan",
    "Mayis",
    "Haziran",
    "Temmuz",
    "Agustos",
    "Eylul",
    "Ekim",
    "Kasim",
    "Aralik",
  ];

  let result = {};

  data.forEach((item) => {
    let date = new Date(item.changeDate);

    let year = date.getFullYear().toString().substring(2);

    if (year === undefined) {
      return;
    }

    let monthName = months[date.getMonth()];
    if (monthName === undefined) {
      return;
    }

    let operations = JSON.parse(item.operation);

    let total = operations.reduce(
      (sum, operation) => sum + operation.equipmentCost + operation.laborCost,
      0
    );
    const key = `${year}-${monthName}`;

    if (!result[key]) {
      result[key] = { total: 0, labor: 0, equipment: 0 };
    }

    result[key].total += total;

    operations.forEach((operation) => {
      result[key].labor += operation.laborCost;
      result[key].equipment += operation.equipmentCost;
    });
  });

  return result;
}

function getMonthName(month) {
  const monthNames = [
    "Ocak",
    "Subat",
    "Mart",
    "Nisan",
    "Mayis",
    "Haziran",
    "Temmuz",
    "Agustos",
    "Eylul",
    "Ekim",
    "Kasim",
    "Aralik",
  ];
  return monthNames[month - 1];
}

async function fetchDataAndLog() {
  let data = {};
  let resp = await getData();
  data = transformData(resp);
  drawChart(data);

  let tbody = document.getElementById("tableBody");

  for (let month in data) {
    tbody.innerHTML += `<tr><td>${month}</td><td>${data[month].total}</td><td>${data[month].labor}</td><td>${data[month].equipment}</td></tr>`;
  }
}

fetchDataAndLog();

function drawChart(data) {
  let ctx = document.getElementById("myChart").getContext("2d");
  let myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Toplam Kazanc",
          data: Object.values(data).map((item) => item.total),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Iscilik Kazanci",
          data: Object.values(data).map((item) => item.labor),
          backgroundColor: "rgba(255, 206, 86, 0.2)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1,
        },
        {
          label: "Yedek Parca Kazanci",
          data: Object.values(data).map((item) => item.equipment),
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
