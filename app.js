import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOmdDWEpDNKLYnC054aDfHzqd4bxiyeec",
  authDomain: "miniproj-118dd.firebaseapp.com",
  projectId: "miniproj-118dd",
  storageBucket: "miniproj-118dd.appspot.com",
  messagingSenderId: "979056036709",
  appId: "1:979056036709:web:b062a39e5952d1a29fef8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");
const db = getFirestore(app);

class TodoApp {
  constructor() {
    this.loading = document.getElementById("loading");
    this.formContainer = document.getElementById("form-container");
    this.loginForm = document.getElementById("login-form");
    this.loginEmail = document.getElementById("login-email");
    this.loginPassword = document.getElementById("login-password");
    this.loginButton = document.getElementById("login-button");
    this.googleAuthButton = document.getElementById("google-auth-button");
    this.microsoftAuthButton = document.getElementById("microsoft-auth-button");
    this.registerForm = document.getElementById("register-form");
    this.registerEmail = document.getElementById("register-email");
    this.registerPassword = document.getElementById("register-password");
    this.registerButton = document.getElementById("register-button");
    this.modal = document.getElementById("modal");
    this.openModalButton = document.getElementById("open-modal-button");
    this.closeModalButton = document.getElementById("close-modal-button");
    this.userProfile = document.getElementById("user-profile");
    this.profile = document.getElementById("profile");
    this.profileDisplayNameInput = document.getElementById("profile-display-name-input");
    this.profilePhotoURL = document.getElementById("profile-photo-url");
    this.profileUpdateButton = document.getElementById("profile-update-button");
    this.emailVerifiedButton = document.getElementById("email-verified-button");
    this.logoutButton = document.getElementById("logout-button");
    this.todo = document.getElementById("todo");
    this.todoInput = document.getElementById("todo-input");
    this.todoList = document.getElementById("todo-list");
    this.addTodoButton = document.getElementById("add-todo-button");
    this.todoEmailVerifiedError = document.getElementById("todo-email-verified-error");
    this.loginError = document.getElementById("login-error");
    this.registerError = document.getElementById("register-error");

    this.loginButton.addEventListener("click", this.login.bind(this));
    this.googleAuthButton.addEventListener("click", this.googleAuth.bind(this));
    this.microsoftAuthButton.addEventListener("click", this.microsoftAuth.bind(this));
    this.registerButton.addEventListener("click", this.register.bind(this));
    this.logoutButton.addEventListener("click", this.logout.bind(this));
    this.emailVerifiedButton.addEventListener("click", this.emailVerification.bind(this));
    this.profileUpdateButton.addEventListener("click", this.updateProfile.bind(this));
    this.addTodoButton.addEventListener("click", this.addTodo.bind(this));
    this.todoInput.addEventListener("input", () => {
      this.checkTodoInput(this);
    });

    this.checkAuthState();
  }

  checkAuthState() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.loading.style.display = "none";
        this.formContainer.style.display = "none";
        this.profile.style.display = "grid";
        this.todo.style.display = "grid";
        this.getUserProfile();
        this.emailVerification();
        this.loadTodoList();
      } else {
        this.loading.style.display = "none";
        this.formContainer.style.display = "grid";
        this.profile.style.display = "none";
        this.todo.style.display = "none";
      }
    });
  }

  async googleAuth() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error.message);
    }
  }

  async microsoftAuth() {
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (error) {
      console.error(error.message);
    }
  }

  emailVerification() {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      this.emailVerifiedButton.style.display = "block";
      this.emailVerifiedButton.addEventListener("click", () => {
        sendEmailVerification(user);
      });
    } else {
      this.emailVerifiedButton.style.display = "none";
    }
  }

  getUserProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName || "";
      const email = user.email || "";
      const photoURL = user.photoURL || "";
      let userProfileText = `Welcome, ${displayName} (${email})`;
      if (photoURL) {
        userProfileText = `<img class='photoURL' src=${photoURL} /> ${userProfileText}`;
      }
      this.userProfile.innerHTML = userProfileText;
    }
  }

  updateProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = this.profileDisplayNameInput.value;
      const photoURL = this.profilePhotoURL.value;
      updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL,
      }).then(() => {
        this.modal.style.display = "none";
        this.getUserProfile();
      }).catch((error) => {
        console.log(error.message);
      });
    }
  }

  checkTodoInput() {
    const todoText = this.todoInput.value;
    this.addTodoButton.disabled = todoText === "";
  }

  async addTodo() {
    const todoText = this.todoInput.value;
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      await addDoc(collection(db, "todos"), {
        userId: user.uid,
        text: todoText,
        completed: false,
        createdAt: serverTimestamp(),
      });
      this.todoInput.value = "";
    } else {
      this.todoEmailVerifiedError.style.display = "block";
      this.todoEmailVerifiedError.innerHTML = "You must verify your email to add todos.";
    }
  }

  loadTodoList() {
    const user = auth.currentUser;
    if (user) {
      const todosRef = query(
        collection(db, "todos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      onSnapshot(todosRef, (querySnapshot) => {
        this.todoList.innerHTML = "";
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const todoItem = document.createElement("div");
          todoItem.classList.add("todoItem");
          const todoText = document.createElement("span");
          todoText.textContent = data.text;
          todoText.classList.add(data.completed ? "completed" : "notCompleted");
          todoText.addEventListener("click", () => {
            const newCompletedValue = !data.completed;
            updateDoc(doc(db, "todos", doc.id), {
              completed: newCompletedValue,
            });
          });
          const todoButtons = document.createElement("div");
          todoButtons.classList.add("todoButtons");
          const editButton = document.createElement("button");
          editButton.classList.add("editButton");
          editButton.textContent = "Edit";
          editButton.addEventListener("click", () => {
            this.editTodoInput(data, doc.id, todoText, todoItem);
          });
          const deleteButton = document.createElement("button");
          deleteButton.classList.add("deleteButton");
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => {
            deleteDoc(doc(db, "todos", doc.id));
          });
          todoButtons.appendChild(editButton);
          todoButtons.appendChild(deleteButton);
          todoItem.appendChild(todoText);
          todoItem.appendChild(todoButtons);
          this.todoList.appendChild(todoItem);
        });
      });
    }
  }

  editTodoInput(data, todoId, currentText, todoItem) {
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = currentText.textContent;
    inputElement.classList.add("editInput");
    const todoButtons = todoItem.querySelector(".todoButtons");
    todoButtons.style.display = "none";
    const editButtons = document.createElement("div");
    const saveButton = document.createElement("button");
    saveButton
