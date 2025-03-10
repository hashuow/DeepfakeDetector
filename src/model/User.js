export default class User {
    constructor(firstName, lastName, username, email, password, phone, isActive = 1) {
      this.firstName = firstName;
      this.lastName = lastName;
      this.username = username;
      this.email = email;
      this.password = password;
      this.phone = phone;
      this.createdDateTime = new Date().toISOString(); // Auto-generate timestamp
      this.isActive = isActive; // Default to 1 (active)
    }
  }
  