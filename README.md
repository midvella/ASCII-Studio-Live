# ASCII Studio Live

Tarayıcı tabanlı, donanım hızlandırmalı ve sıfır dış bağımlılığa sahip ASCII video ve görsel dönüştürme stüdyosu.

Canlı Test / Demo: https://midvella.github.io/ASCII-Studio-Live/

---

## Genel Bakış

ASCII Studio Live; video, resim ve canlı web kamerası görüntülerini doğrudan tarayıcı üzerinde, herhangi bir sunucu veya üçüncü taraf kütüphaneye (Node.js, FFmpeg, OpenCV vb.) ihtiyaç duymadan gerçek zamanlı olarak ASCII karakterlerine dönüştüren bir web uygulamasıdır.

Tüm işlem istemci tarafında (client-side) donanım hızlandırmalı HTML5 Canvas ve optimize edilmiş tamsayı algoritmaları kullanılarak yürütülür.

---

## Temel Özellikler

### Medya Desteği
- **Video Formatları:** MP4, WebM, MOV, OGG, AVI ve hareketli GIF dosyaları.
- **Görsel Formatları:** PNG, JPG, JPEG, WebP, SVG, BMP.
- **Canlı Kamera:** Web kamerasından gelen görüntüyü gerçek zamanlı ASCII akışına dönüştürme.
- **Panodan Yapıştırma (Clipboard):** Ctrl+V kısayolu ile ekran görüntüsü ve panodaki görselleri doğrudan içeri aktarma.
- **Sürükle-Bırak:** Dosyaları doğrudan tarayıcı penceresine bırakarak yükleme.

### Performans ve Donanım Optimizasyonu
- **Sıfır DOM Yükü:** Karakterler ağır DOM düğümleri yerine doğrudan donanım hızlandırmalı 2D Canvas bağlamına çizilir.
- **Lookup Table (LUT) Parlaklık Haritalaması:** Her piksel için 256 elemanlı önceden hesaplanmış parlaklık tablosu kullanılarak CPU yükü minimuma indirilir.
- **FPS Sınırlandırma Denetleyicisi:** Hedef kare hızı (10 - 60 FPS) seçilerek donanım kaynak tüketimi sınırlandırılabilir.
- **Düşük Bellek Ayak İzi:** Akış içi kare işleme sayesinde büyük video dosyalarında dahi bellek şişmesi yaşanmaz.

### Görüntü İşleme ve Temalar
- **Renk Modları:**
  - True Color (RGB): Her karakter orijinal piksel rengini taşır.
  - Matrix: Klasik monokrom yeşil hacker terminal teması.
  - Amber CRT: 1980'ler fosforlu monokrom monitör teması.
  - Cyberpunk: Kontrastlı neon mavi ve pembe palet.
  - Tek Renk (Monokrom): Kullanıcı tanımlı metin ve arka plan rengi.
- **Filtreler ve Ayarlar:**
  - Kontrast, Parlaklık ve Gamma eğrisi ayarları.
  - Parlaklığı tersine çevirme (Invert modu).
  - CRT tarama çizgileri (Scanlines) ve vinyet efekti.
  - Sobel operatörü tabanlı kenar belirleme (Edge Detection / Tel Kafes modu).
- **Karakter Setleri:** Standart dengeli, yoğun ayrıntılı (70 karakter), blok gölgelendirme, minimalist, ikili sistem (0/1), matematiksel semboller, Matrix Katakana ve kullanıcıya özel tanımlanabilir karakter dizisi.

### Dışa Aktarma ve İndirme
- **Otomatik Video Dönüştürme:** Yüklenen videoyu baştan sona otomatik işler, orijinal ses parçasını ASCII görsel akışıyla birleştirir ve hazır WebM dosyasını doğrudan indirir.
- **Görsel İndirme:** Yüksek çözünürlüklü PNG ve JPG formatlarında anlık görüntü çıktısı.
- **Metin Olarak İndirme:** UTF-8 BOM kodlamalı saf ASCII `.txt` dosyası.
- **Panoya Kopyalama:** Tek tıklamayla anlık ASCII karakter metnini işletim sistemi panosuna aktarma.

---

## Kurulum ve Çalıştırma

Proje hiçbir derleme adımı (build step), paket yöneticisi veya sunucu bağımlılığı gerektirmez.

### 1. Yerel Olarak Çalıştırma

Depoyu klonlayın:

```bash
git clone https://github.com/midvella/ASCII-Studio-Live.git
cd ASCII-Studio-Live
```

Doğrudan tarayıcıda açabilirsiniz:

- **Linux:** `xdg-open index.html`
- **macOS:** `open index.html`
- **Windows:** `start index.html`

Veya yerel bir statik sunucu üzerinden çalıştırmak için:

```bash
# Python ile:
python3 -m http.server 8080

# veya Node.js kuruluysa:
npx serve .
```

Ardından tarayıcınızdan `http://localhost:8080` adresine gidin.


## Klavye Kısayolları

| Kısayol | İşlev |
| :--- | :--- |
| Space | Video veya demo animasyonunu Oynat / Duraklat |
| M | Video sesini Aç / Kapat (Mute) |
| C | Anlık ASCII metin çıktısını panoya kopyala |
| Ctrl + V | Panodaki görseli doğrudan uygulamaya aktar |

---

## Proje Dizin Yapısı

```text
ascii-live/
├── index.html            # Ana HTML arayüzü ve bileşen yapısı
├── css/
│   └── style.css         # Arayüz ve tema stilleri
├── js/
│   ├── ascii-engine.js   # Donanım hızlandırmalı ASCII piksel işleme motoru
│   ├── media-handler.js  # Video, görsel, kamera ve kare hızı yöneticisi
│   ├── recorder.js       # İstemci taraflı video ve görsel dönüştürücü
│   └── app.js            # Kullanıcı arayüzü kontrolörü ve olay bağlayıcıları
├── LICENSE               # MIT Lisans dosyası
└── README.md             # Dokümantasyon
```

---

## Lisans

Bu proje [LICENSE](LICENSE) kapsamında lisanslanmıştır. Ticari ve kişisel amaçlarla serbestçe kullanılabilir, değiştirilebilir ve dağıtılabilir.
