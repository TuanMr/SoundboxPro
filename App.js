const API_URL = "https://script.google.com/macros/s/AKfycbzseTjHON-5CTHL7g_i1HvSrCrs8Drv5uuNvImdEc5fH1gnFyrqLB83C_kOvu5I4Upz/exec";

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');
}

let scannedSerials = [];

function startScanner() {

  const html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(devices => {

    html5QrCode.start(
      devices[0].id,
      {
        fps: 10,
        qrbox: 250
      },

      async (decodedText) => {

        let serial = decodedText.trim().toUpperCase();

        if (scannedSerials.includes(serial)) {
          return;
        }

        scannedSerials.push(serial);

        const sale = document.getElementById("saleName").value;
        const machine = document.getElementById("machineType").value;

        const response = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "add",
            sale,
            machine,
            serial
          })
        });

        const result = await response.json();

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${serial}</td>
          <td>${result.success ? 'OK' : 'TRÙNG'}</td>
        `;

        document.getElementById("scanTable").prepend(tr);

        navigator.vibrate(200);
      }
    );

  });
}

async function searchData() {

  const sale = document.getElementById("searchSale").value;
  const machine = document.getElementById("searchMachine").value;
  const serial = document.getElementById("searchSerial").value;

  const response = await fetch(
    `${API_URL}?action=search&sale=${sale}&machine=${machine}&serial=${serial}`
  );

  const data = await response.json();

  const table = document.getElementById("searchTable");

  table.innerHTML = "";

  data.forEach(item => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.sale}</td>
      <td>${item.machine}</td>
      <td>${item.serial}</td>
      <td>${item.status}</td>
    `;

    table.appendChild(tr);
  });
}

async function transferMachine() {

  const serial = document.getElementById("transferSerial").value;
  const sale = document.getElementById("transferSale").value;
  const machine = document.getElementById("transferMachine").value;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "transfer",
      serial,
      sale,
      machine
    })
  });

  alert("Updated");
}

function uploadExcel() {

  const file = document.getElementById("excelFile").files[0];

  const reader = new FileReader();

  reader.onload = async function(e) {

    const data = new Uint8Array(e.target.result);

    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(sheet);

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "export",
        items: json
      })
    });

    alert("Export success");
  };

  reader.readAsArrayBuffer(file);
}

async function loadInventory() {

  const sale = document.getElementById("inventorySale").value;
  const machine = document.getElementById("inventoryMachine").value;

  const response = await fetch(
    `${API_URL}?action=inventory&sale=${sale}&machine=${machine}`
  );

  const data = await response.json();

  const table = document.getElementById("inventoryTable");

  table.innerHTML = "";

  data.forEach(item => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.sale}</td>
      <td>${item.machine}</td>
      <td>${item.serial}</td>
    `;

    table.appendChild(tr);
  });
}

function exportInventoryExcel() {

  const table = document.getElementById("inventoryTable");

  const wb = XLSX.utils.table_to_book(table);

  XLSX.writeFile(wb, "inventory.xlsx");
}
