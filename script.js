// script.js
let db;
const request = indexedDB.open("gamePostsDB", 2);

request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = e => {
  db = e.target.result;
  loadPosts();
  const params = new URLSearchParams(location.search);
  if (params.has("payload")) {
    addPostFromCode(params.get("payload"));
  }
};

const postsDiv = document.getElementById("posts");
const form = document.getElementById("addForm");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("desc");
const fileEl = document.getElementById("file");
const codeBox = document.getElementById("generatedCode");
const clearBtn = document.getElementById("clearBtn");

form.addEventListener("submit", async e => {
  e.preventDefault();
  let files = [];
  if (fileEl.files.length) {
    for (const f of fileEl.files) {
      files.push({
        data: await toBase64(f),
        name: f.name
      });
    }
  }
  const post = {
    title: titleEl.value,
    desc: descEl.value,
    files,
    date: new Date().toLocaleString()
  };
  savePost(post);
  titleEl.value = "";
  descEl.value = "";
  fileEl.value = "";
});

clearBtn.onclick = () => {
  if (confirm("Удалить все посты?")) {
    const tx = db.transaction("posts", "readwrite");
    tx.objectStore("posts").clear();
    postsDiv.innerHTML = "";
  }
};

function savePost(post) {
  const tx = db.transaction("posts", "readwrite");
  tx.objectStore("posts").add(post);
  tx.oncomplete = () => {
    renderPost(post);
    generateCode(post);
  };
}

function loadPosts() {
  const tx = db.transaction("posts", "readonly");
  const store = tx.objectStore("posts");
  store.getAll().onsuccess = e => {
    postsDiv.innerHTML = "";
    e.target.result.forEach(renderPost);
  };
}

function renderPost(post) {
  const div = document.createElement("div");
  div.className = "post";
  const filesHTML = post.files && post.files.length ? post.files.map(f => `<div><a download="${f.name}" href="${f.data}">Скачать ${f.name}</a></div>`).join("") : "";
  div.innerHTML = `
    <h3>${post.title}</h3>
    <div class="muted small">${post.date}</div>
    <p>${post.desc || ""}</p>
    ${filesHTML}
  `;
  postsDiv.prepend(div);
}

function generateCode(post) {
  const code = btoa(JSON.stringify(post));
  codeBox.textContent = code;
}

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function addPostFromCode(code) {
  try {
    const post = JSON.parse(atob(code));
    savePost(post);
  } catch {
    alert("Неверный код поста");
  }
}

window.addPostFromCode = addPostFromCode;
