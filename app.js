function addProduct() {
  try {
    const name = document.getElementById('p_name').value.trim();
    if (!name) {
      alert('Nom requis');
      return;
    }

    const sku = document.getElementById('p_sku').value.trim();
    const price = parseInt(document.getElementById('p_price').value) || 0;
    const cost = parseInt(document.getElementById('p_cost').value) || 0;
    const qty = parseInt(document.getElementById('p_qty').value) || 0;
    const fileInput = document.getElementById('p_image');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const id = 'p_' + Date.now();

    const save = (imgData) => {
      const prod = { id, name, sku, price, cost, qty, image: imgData || null };
      const list = loadProducts();
      list.push(prod);
      saveProducts(list);
      clearForm();
      renderProductList();
      updateDashboard();
      alert('✅ Produit enregistré avec succès !');
    };

    // Si aucune image, on enregistre directement
    if (!file) {
      save(null);
      return;
    }

    // Sinon, on lit l'image
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const img = new Image();
        img.onload = function () {
          const maxW = 600;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          save(dataUrl);
        };
        img.src = e.target.result;
      } catch (err) {
        console.error('Erreur image :', err);
        save(null);
      }
    };
    reader.onerror = () => {
      console.error('Erreur FileReader');
      save(null);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('Erreur inattendue :', err);
    alert('❌ Une erreur est survenue. Réessayez.');
  }
}
