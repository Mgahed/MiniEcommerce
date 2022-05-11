const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value;
  const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;

  const productElement = btn.closest('article');

  fetch('/admin/delete-product/' + productId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrfToken
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        productElement.parentNode.removeChild(productElement);
      } else {
        alert(data.message);
      }
    })
    .catch(err => {
      console.log(err);
    });
}