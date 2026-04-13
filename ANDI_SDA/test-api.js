const email = "admin@marher.com";
const password = "$p4$ww0rD1234";
const url = "https://spatial-delcine-devemma-edfc3f92.koyeb.app/login";

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email, password })
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(res => {
  if (res.status === 200) {
    const token = res.data.data[0].token;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    console.log("Token payload:", JSON.parse(jsonPayload));
  } else {
    console.log(res);
  }
})
.catch(console.error);
