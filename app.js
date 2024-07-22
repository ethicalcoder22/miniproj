import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOmdDWEpDNKLYnC054aDfHzqd4bxiyeec",
  authDomain: "miniproj-118dd.firebaseapp.com",
  projectId: "miniproj-118dd",
  storageBucket: "miniproj-118dd.appspot.com",
  messagingSenderId: "979056036709",
  appId: "1:979056036709:web:b062a39e5952d1a29fef8c"
};

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
    this.profileDisplayNameInput = document.getElementById(
      "profile-display-name-input"
    );
    this.profilePhotoURL = document.getElementById("profile-photo-url");
    this.profileUpdateButton = document.getElementById("profile-update-button");
    this.emailVerifiedButton = document.getElementById("email-verified-button");
    this.logoutButton = document.getElementById("logout-button");

    this.todo = document.getElementById("todo");
    this.todoInput = document.getElementById("todo-input");
    this.todoList = document.getElementById("todo-list");
    this.addTodoButton = document.getElementById("add-todo-button");

    this.todoEmailVerifiedError = document.getElementById(
      "todo-email-verified-error"
    );

    this.loginError = document.getElementById("login-error");
    this.registerError = document.getElementById("register-error");

    this.loginButton.addEventListener("click", this.login.bind(this));
    this.googleAuthButton.addEventListener("click", this.googleAuth.bind(this));
    this.microsoftAuthButton.addEventListener(
      "click",
      this.microsoftAuth.bind(this)
    );
    this.registerButton.addEventListener("click", this.register.bind(this));
    this.logoutButton.addEventListener("click", this.logout.bind(this));
    this.emailVerifiedButton.addEventListener(
      "click",
      this.emailVerification.bind(this)
    );
    this.profileUpdateButton.addEventListener(
      "click",
      this.updateProfile.bind(this)
    );

    this.profileDisplayNameInput.addEventListener("input", () => {
      this.checkProfileInputs();
    });

    this.profilePhotoURL.addEventListener("input", () => {
      this.checkProfileInputs();
    });

    this.addTodoButton.addEventListener("click", this.addTodo.bind(this));

    this.todoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !this.addTodoButton.disabled) {
        this.addTodo();
      }
    });

    this.todoInput.addEventListener("input", () => {
      this.checkTodoInput(this);
    });

    this.loginEmail.addEventListener("input", this.checkLoginInputs.bind(this));
    this.loginPassword.addEventListener(
      "input",
      this.checkLoginInputs.bind(this)
    );

    this.registerEmail.addEventListener(
      "input",
      this.checkRegisterInputs.bind(this)
    );
    this.registerPassword.addEventListener(
      "input",
      this.checkRegisterInputs.bind(this)
    );

    this.loginButton.disabled = true;
    this.registerButton.disabled = true;
    this.addTodoButton.disabled = true;
    this.profileUpdateButton.disabled = true;

    this.checkAuthState();
  }

  checkAuthState() {
    if (!auth.user) {
      this.loading.style.display = "block";

      this.formContainer.style.display = "none";
      this.profile.style.display = "none";
      this.todo.style.display = "none";
    } else {
      this.loading.style.display = "none";
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.loading.style.display = "none";

        this.formContainer.style.display = "none";
        this.profile.style.display = "grid";
        this.todo.style.display = "grid";

        this.todoEmailVerifiedError.style.display = "none";

        this.loginError.innerHTML = "";
        this.registerError.innerHTML = "";

        this.profileDisplayNameInput.value = user.displayName;
        this.profilePhotoURL.value = user.photoURL;

        this.getUserProfile();
        this.loadTodoList();
      } else {
        this.loading.style.display = "none";

        this.loginError.innerHTML = "";
        this.registerError.innerHTML = "";

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
        sendEmailVerification(user)
          .then(() => {
            console.log("Verification email sent.");
          })
          .catch((error) => {
            console.error(error.message);
          });
      });
    } else {
      this.emailVerifiedButton.style.display = "none";
    }
  }

  getUserProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName;
      const email = user.email;
      const photoURL = user.photoURL;

      let userProfileText = `Welcome, ${
        displayName ? displayName : ""
      } (${email})`;

      if (photoURL) {
        userProfileText = `<img class='photoURL' src=${photoURL} /> ${userProfileText}`;
      }

      this.userProfile.innerHTML = userProfileText;
    }
  }

  updateProfileModal() {
    this.openModalButton.addEventListener("click", () => {
      this.modal.style.display = "grid";
    });

    this.closeModalButton.addEventListener("click", () => {
      this.modal.style.display = "none";
    });
  }

  updateProfile() {
    const user = auth.currentUser;
    if (user) {
      const displayName = this.profileDisplayNameInput.value;
      const photoURL = this.profilePhotoURL.value;

      if (!this.isProfileInputValid(displayName, photoURL)) {
        return;
      }

      updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL,
      })
        .then(() => {
          this.modal.style.display = "none";
          this.getUserProfile();
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  }

  isProfileInputValid(displayName, photoURL) {
    if (!displayName && !photoURL) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    const displayNameRegex = /^[A-Za-z\s]+$/;
    if (!displayNameRegex.test(displayName)) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    const urlRegex = /^(http|https):\/\/\S+$/;
    if (photoURL && !urlRegex.test(photoURL)) {
      this.profileUpdateButton.disabled = true;
      return false;
    }

    this.profileUpdateButton.disabled = false;
    return true;
  }

  async login() {
    this.loginError.innerHTML = "";

    const email = this.loginEmail.value;
    const password = this.loginPassword.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      this.loginError.innerHTML = error.message;
    }
  }

  async register() {
    this.registerError.innerHTML = "";

    const email = this.registerEmail.value;
    const password = this.registerPassword.value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      this.registerError.innerHTML = error.message;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error.message);
    }
  }

  checkLoginInputs() {
    const email = this.loginEmail.value;
    const password = this.loginPassword.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email) && password.length >= 6) {
      this.loginButton.disabled = false;
    } else {
      this.loginButton.disabled = true;
    }
  }

  checkRegisterInputs() {
    const email = this.registerEmail.value;
    const password = this.registerPassword.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email) && password.length >= 6) {
      this.registerButton.disabled = false;
    } else {
      this.registerButton.disabled = true;
    }
  }

  checkProfileInputs() {
    const displayName = this.profileDisplayNameInput.value;
    const photoURL = this.profilePhotoURL.value;

    if (this.isProfileInputValid(displayName, photoURL)) {
      this.profileUpdateButton.disabled = false;
    } else {
      this.profileUpdateButton.disabled = true;
    }
  }

  checkTodoInput() {
    const todoInputValue = this.todoInput.value;
    if (todoInputValue) {
      this.addTodoButton.disabled = false;
    } else {
      this.addTodoButton.disabled = true;
    }
  }

  loadTodoList() {
    const user = auth.currentUser;
    if (user) {
      const todosQuery = query(
        collection(db, "todos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      onSnapshot(todosQuery, (snapshot) => {
        this.todoList.innerHTML = "";
        snapshot.forEach((doc) => {
          this.renderTodoItem(doc.id, doc.data());
        });
      });
    }
  }

  async addTodo() {
    const todo = this.todoInput.value;

    const user = auth.currentUser;
    if (!user) {
      return;
    }

    if (!user.emailVerified) {
      this.todoEmailVerifiedError.style.display = "block";
      return;
    }

    try {
      await addDoc(collection(db, "todos"), {
        userId: user.uid,
        todo: todo,
        createdAt: serverTimestamp(),
      });

      this.todoInput.value = "";
      this.addTodoButton.disabled = true;
    } catch (error) {
      console.error(error.message);
    }
  }

  renderTodoItem(todoId, todoData) {
    const todoItem = document.createElement("li");
    todoItem.classList.add("todo-item");

    const todoText = document.createElement("span");
    todoText.classList.add("todo-text");
    todoText.textContent = todoData.todo;

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("todo-delete-button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => this.deleteTodoItem(todoId));

    const updateButton = document.createElement("button");
    updateButton.classList.add("todo-update-button");
    updateButton.textContent = "Update";
    updateButton.addEventListener("click", () => {
      const newTodoText = prompt("Update todo:", todoData.todo);
      if (newTodoText) {
        this.updateTodoItem(todoId, newTodoText);
      }
    });

    todoItem.appendChild(todoText);
    todoItem.appendChild(updateButton);
    todoItem.appendChild(deleteButton);

    this.todoList.appendChild(todoItem);
  }

  async deleteTodoItem(todoId) {
    try {
      const todoDoc = doc(db, "todos", todoId);
      await deleteDoc(todoDoc);
    } catch (error) {
      console.error(error.message);
    }
  }

  async updateTodoItem(todoId, newTodoText) {
    try {
      const todoDoc = doc(db, "todos", todoId);
      await updateDoc(todoDoc, {
        todo: newTodoText,
      });
    } catch (error) {
      console.error(error.message);
    }
  }
}

const todoApp = new TodoApp();
