// script.js
let db;
const request = indexedDB.open("gamePostsDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("posts", { keyPath: "id", autoIncrement: true });
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
  let fileData = null;
  if (fileEl.files.length) {
    fileData = await toBase64(fileEl.files[0]);
  }
  const post = {
    title: titleEl.value,
    desc: descEl.value,
    file: fileData,
    fileName: fileEl.files[0]?.name || null,
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
  div.innerHTML = `
    <h3>${post.title}</h3>
    <div class="muted small">${post.date}</div>
    <p>${post.desc || ""}</p>
    ${post.file ? `<a download="${post.fileName}" href="${post.file}">Скачать файл</a>` : ""}
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
