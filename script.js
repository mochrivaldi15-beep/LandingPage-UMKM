"use strict";

// Nomor WhatsApp penjual, menggunakan kode negara 62.
const NOMOR_WA_PENJUAL = "62895351243355";

// Tempat gambar QR resmi.
// Masukkan gambar QR milik penjual dengan nama file di bawah ini.
const QR_PEMBAYARAN = {
    "Transfer Bank": {
        gambar: "images/qr-transfer-bank.png",
        catatan: "Gunakan QR resmi yang disediakan penjual."
    },
    "DANA": {
        gambar: "images/qr-dana.png",
        catatan: "Pastikan QR merupakan milik akun DANA penjual."
    },
    "OVO": {
        gambar: "images/qr-ovo.png",
        catatan: "Pastikan QR merupakan milik akun OVO penjual."
    },
    "GoPay": {
        gambar: "images/qr-gopay.png",
        catatan: "Pastikan QR merupakan milik akun GoPay penjual."
    }
};

// Keranjang belanja
let cart = [];

// Elemen QR
const metodeSelect = document.getElementById("metode");
const qrPayment = document.getElementById("qr-payment");
const qrImage = document.getElementById("qr-image");
const qrPlaceholder = document.getElementById("qr-placeholder");
const qrTitle = document.getElementById("qr-title");
const qrNote = document.getElementById("qr-note");

// Format harga Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Menghitung total belanja
function hitungTotal() {
    return cart.reduce(function(total, item) {
        return total + item.price;
    }, 0);
}

// Menambahkan produk ke keranjang
function addToCart(name, price) {
    if (
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isFinite(price) ||
        price <= 0
    ) {
        alert("Produk tidak valid.");
        return;
    }

    cart.push({
        name: name,
        price: price
    });

    updateCart();

    alert(name + " berhasil ditambahkan ke keranjang!");
}

// Menampilkan isi keranjang
function updateCart() {
    const cartCount = document.getElementById("cart-count");
    const cartItems = document.getElementById("cart-items");
    const totalPrice = document.getElementById("total-price");

    cartCount.textContent = cart.length;
    cartItems.replaceChildren();

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty";
        emptyMessage.textContent = "Belum ada produk di keranjang.";

        cartItems.appendChild(emptyMessage);
        totalPrice.textContent = formatRupiah(0);
        return;
    }

    cart.forEach(function(item, index) {
        const product = document.createElement("div");
        product.className = "cart-product";

        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = item.name;

        const price = document.createElement("small");
        price.textContent = formatRupiah(item.price);

        info.appendChild(name);
        info.appendChild(price);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-btn";
        removeButton.textContent = "Hapus";
        removeButton.setAttribute(
            "aria-label",
            "Hapus " + item.name + " dari keranjang"
        );

        removeButton.addEventListener("click", function() {
            removeItem(index);
        });

        product.appendChild(info);
        product.appendChild(removeButton);
        cartItems.appendChild(product);
    });

    totalPrice.textContent = formatRupiah(hitungTotal());
}

// Menghapus produk
function removeItem(index) {
    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }

    cart.splice(index, 1);
    updateCart();
}

// Menampilkan QR sesuai metode pembayaran
function updateQR() {
    const metode = metodeSelect.value;

    // QR hanya ditampilkan untuk pembayaran online.
    if (!QR_PEMBAYARAN[metode]) {
        qrPayment.hidden = true;
        qrImage.removeAttribute("src");
        qrImage.hidden = true;
        qrPlaceholder.hidden = false;
        return;
    }

    const qr = QR_PEMBAYARAN[metode];

    qrPayment.hidden = false;
    qrTitle.textContent = "QR Pembayaran " + metode;
    qrNote.textContent = qr.catatan;

    // Sembunyikan gambar lama sebelum gambar baru dimuat.
    qrImage.hidden = true;
    qrPlaceholder.hidden = false;
    qrPlaceholder.textContent =
        "Memeriksa gambar QR resmi...";

    qrImage.onerror = function() {
        qrImage.hidden = true;
        qrPlaceholder.hidden = false;
        qrPlaceholder.textContent =
            "QR resmi belum tersedia. Penjual perlu menambahkan file gambar QR.";
    };

    qrImage.onload = function() {
        qrImage.hidden = false;
        qrPlaceholder.hidden = true;
    };

    qrImage.src = qr.gambar;
}

// Memperbarui QR ketika metode pembayaran berubah.
metodeSelect.addEventListener("change", updateQR);

// Normalisasi nomor telepon untuk ditampilkan dalam pesan.
function normalisasiTelepon(nomor) {
    return nomor.trim().replace(/[\s()-]/g, "");
}

// Menyiapkan pesan pesanan untuk WhatsApp.
function buatPesanWhatsApp(data) {
    const daftarProduk = cart.map(function(item, index) {
        return (
            (index + 1) + ". " + item.name +
            " - " + formatRupiah(item.price)
        );
    }).join("\n");

    return [
        "HALO FUTSALKICKS, SAYA INGIN MEMESAN SEPATU FUTSAL.",
        "",
        "Nomor pesanan: " + data.invoice,
        "Nama pembeli: " + data.nama,
        "Nomor WhatsApp pembeli: " + data.telepon,
        "Alamat pengiriman: " + data.alamat,
        "",
        "DAFTAR PESANAN:",
        daftarProduk,
        "",
        "Total: " + formatRupiah(hitungTotal()),
        "Metode pembayaran: " + data.metode,
        "",
        "Mohon konfirmasi ketersediaan barang dan instruksi pembayaran.",
        "Saya memahami bahwa pesanan ini belum dikonfirmasi lunas."
    ].join("\n");
}

// Checkout dan kirim detail pesanan melalui WhatsApp.
document.getElementById("payment-form").addEventListener(
    "submit",
    function(event) {
        event.preventDefault();

        if (cart.length === 0) {
            alert("Silakan pilih produk terlebih dahulu!");

            document.getElementById("produk").scrollIntoView({
                behavior: "smooth"
            });

            return;
        }

        const nama = document.getElementById("nama").value.trim();
        const teleponInput = document.getElementById("telepon").value;
        const telepon = normalisasiTelepon(teleponInput);
        const alamat = document.getElementById("alamat").value.trim();
        const metode = metodeSelect.value;

        if (!nama || !telepon || !alamat || !metode) {
            alert("Mohon lengkapi semua data pembeli.");
            return;
        }

        // Validasi dasar nomor telepon Indonesia/internasional.
        const nomorValid = /^\+?[0-9]{9,16}$/.test(telepon);

        if (!nomorValid) {
            alert("Periksa kembali nomor WhatsApp pembeli.");
            document.getElementById("telepon").focus();
            return;
        }

        const invoiceNumber =
            "FK-" + Date.now().toString().slice(-8);

        const dataPesanan = {
            invoice: invoiceNumber,
            nama: nama,
            telepon: telepon,
            alamat: alamat,
            metode: metode
        };

        const pesan = buatPesanWhatsApp(dataPesanan);

        const urlWhatsApp =
            "https://wa.me/" +
            NOMOR_WA_PENJUAL +
            "?text=" +
            encodeURIComponent(pesan);

        // Tampilkan ringkasan pesanan, bukan klaim pembayaran berhasil.
        const invoice = document.getElementById("invoice");
        invoice.replaceChildren();

        const detail = [
            ["Nomor pesanan", invoiceNumber],
            ["Pembeli", nama],
            ["WhatsApp", telepon],
            ["Alamat", alamat],
            ["Pembayaran", metode],
            ["Total", formatRupiah(hitungTotal())]
        ];

        detail.forEach(function(baris) {
            const p = document.createElement("p");
            const label = document.createElement("strong");

            label.textContent = baris[0] + ": ";
            p.appendChild(label);
            p.appendChild(document.createTextNode(baris[1]));
            invoice.appendChild(p);
        });

        document.getElementById("modal-title").textContent =
            "Pesanan Disiapkan";

        document.getElementById("modal-message").textContent =
            "Lanjutkan ke WhatsApp untuk mengirim pesanan kepada penjual. Pesanan belum dianggap lunas.";

        // Tombol WhatsApp dibuat sebagai tautan nyata agar dapat
        // dibuka pembeli jika browser memblokir jendela baru.
        const whatsappLink = document.createElement("a");
        whatsappLink.href = urlWhatsApp;
        whatsappLink.target = "_blank";
        whatsappLink.rel = "noopener noreferrer";
        whatsappLink.className = "btn-whatsapp";
        whatsappLink.textContent = "Kirim Pesanan ke WhatsApp";
        whatsappLink.style.marginTop = "15px";

        invoice.appendChild(whatsappLink);

        document.getElementById("success-modal").style.display = "flex";

        // Membuka WhatsApp langsung dari aksi checkout.
        const tabWhatsApp = window.open(urlWhatsApp, "_blank");

        if (!tabWhatsApp) {
            alert(
                "Jika WhatsApp tidak terbuka otomatis, " +
                "tekan tombol Kirim Pesanan ke WhatsApp."
            );
        }

        // Keranjang tidak dihapus otomatis, sehingga pesanan tetap
        // tersedia jika pembeli perlu mencoba membuka WhatsApp lagi.
    }
);

// Menutup modal
function closeModal() {
    document.getElementById("success-modal").style.display = "none";
}

// Inisialisasi saat halaman dibuka.
updateCart();
updateQR();