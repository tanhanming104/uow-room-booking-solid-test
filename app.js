// UOW Room Booking System

// show password function
function togglePassword() {
  var passwordInput = document.getElementById("password");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
  } else {
    passwordInput.type = "password";
  }
}

// users (hardcoded)
var users = [
  { email: "teacher@uow", password: "1234", role: "teacher" },
  { email: "student@uow", password: "1234", role: "student" },
  { email: "teacher2@uow", password: "1234", role: "teacher" },
  { email: "student2@uow", password: "1234", role: "student" },
  { email: "teacher3@uow", password: "1234", role: "teacher" },
  { email: "student3@uow", password: "1234", role: "student" },
  { email: "admin@uow",    password: "1111", role: "useradmin"},
];

// load users from localstorage if got (so new accounts / edits by useradmin are kept)
if (localStorage.getItem("uowUsers") != null) {
  users = JSON.parse(localStorage.getItem("uowUsers"));
}

// login logs (who logged in, what type of user, date and time)
var loginLogs = [];
if (localStorage.getItem("uowLoginLogs") != null) {
  loginLogs = JSON.parse(localStorage.getItem("uowLoginLogs"));
}

var editUserIndex = -1;    // -1 means useradmin is not editing an account

// opening hours in minutes (9am = 540, 8pm = 1200)
var OPEN_TIME = 540;
var CLOSE_TIME = 1200;

var rooms = [];
var bookings = [];
var currentUser = null;
var editIndex = -1;        // -1 means not editing a room
var modifyBookingId = -1;  // -1 means not modifying a booking

// load data from localstorage if got
if (localStorage.getItem("uowRooms") != null) {
  rooms = JSON.parse(localStorage.getItem("uowRooms"));
} else {
  // first time open the website, make the 3 default rooms
  rooms = [
    { id: 1, name: "Big Room", capacity: 10, price: 10, promo: "UOW@123", discount: 25, launched: true },
    { id: 2, name: "TV Room", capacity: 5, price: 7, promo: "UOW@123", discount: 25, launched: true },
    { id: 3, name: "Small Room", capacity: 3, price: 4, promo: "UOW@123", discount: 25, launched: true }
  ];
}
if (localStorage.getItem("uowBookings") != null) {
  bookings = JSON.parse(localStorage.getItem("uowBookings"));
}
saveData();

function saveData() {
  localStorage.setItem("uowRooms", JSON.stringify(rooms));
  localStorage.setItem("uowBookings", JSON.stringify(bookings));
  localStorage.setItem("uowUsers", JSON.stringify(users));
  localStorage.setItem("uowLoginLogs", JSON.stringify(loginLogs));
}

// find a room using its id
function findRoom(id) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id == id) {
      return rooms[i];
    }
  }
  return null;
}

// change minutes to time text, eg 570 -> "9:30 AM"
function toTime(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  var ampm = "AM";
  if (h >= 12) {
    ampm = "PM";
  }
  if (h > 12) {
    h = h - 12;
  }
  if (m < 10) {
    m = "0" + m;
  }
  return h + ":" + m + " " + ampm;
}

// get today date like "2026-10-08"
function todayString() {
  var d = new Date();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return d.getFullYear() + "-" + month + "-" + day;
}

// check if room is free at that date and time
// ignoreId is for when student modify their own booking
function isRoomFree(roomId, date, start, end, ignoreId) {
  for (var b = 0; b < bookings.length; b++) {
    if (bookings[b].id == ignoreId) {
      continue;
    }
    if (bookings[b].date != date) {
      continue;
    }
    for (var r = 0; r < bookings[b].rooms.length; r++) {
      if (bookings[b].rooms[r].id == roomId) {
        // times overlap
        if (start < bookings[b].end && bookings[b].start < end) {
          return false;
        }
      }
    }
  }
  return true;
}
// check if this student already has a booking at this date and time
// ignoreId is for when student modify their own booking
function isStudentFree(email, date, start, end, ignoreId) {
for (var b = 0; b < bookings.length; b++) {
if (bookings[b].id == ignoreId) {
continue;
}
if (bookings[b].student != email || bookings[b].date != date) {
continue;
}
// times overlap
if (start < bookings[b].end && bookings[b].start < end) {
return false;
}
}
return true;
}

// ================= LOGIN =================

function login() {
  var email = document.getElementById("email").value.trim().toLowerCase();
  var password = document.getElementById("password").value;
  var found = false;

  for (var i = 0; i < users.length; i++) {
    if (users[i].email == email && users[i].password == password) {
      currentUser = users[i];
      found = true;
    }
  }

  if (found == false) {
    document.getElementById("loginMsg").innerHTML = "Wrong email or password!";
    return;
  }

  document.getElementById("loginMsg").innerHTML = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("loginPage").style.display = "none";

  // save a login log (date and time and type of user)
  addLoginLog(currentUser);

  // teacher, student and useradmin see different pages
  if (currentUser.role == "useradmin") {
    // useradmin sees the teacher page + an Accounts tab
    document.getElementById("adminTabs").style.display = "block";
    document.getElementById("teacherLabel").innerHTML = "Logged in as User Admin";
    showTab("teacher");
  } else if (currentUser.role == "teacher") {
    document.getElementById("teacherLabel").innerHTML = "Logged in as Teacher";
    document.getElementById("teacherPage").style.display = "block";
    showRooms();
    showAllBookings();
  } else {
    document.getElementById("studentPage").style.display = "block";
    setupBookingForm();
    showAvailableRooms();
    showMyBookings();
  }
}

function logout() {
  currentUser = null;
  editIndex = -1;
  modifyBookingId = -1;
  document.getElementById("saveRoomBtn").innerHTML = "Create Room";
  document.getElementById("bookBtn").innerHTML = "Book Selected Rooms";
  document.getElementById("stopModifyBtn").style.display = "none";
  document.getElementById("roomMsg").innerHTML = "";
  document.getElementById("bookMsg").innerHTML = "";
  document.getElementById("teacherPage").style.display = "none";
  document.getElementById("studentPage").style.display = "none";
  document.getElementById("adminPage").style.display = "none";
  document.getElementById("adminTabs").style.display = "none";
  document.getElementById("logModal").style.display = "none";
  document.getElementById("userMsg").innerHTML = "";
  editUserIndex = -1;
  document.getElementById("loginPage").style.display = "block";
}

// record every successful login
function addLoginLog(user) {
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  var sec = d.getSeconds();
  if (m < 10) {
    m = "0" + m;
  }
  if (sec < 10) {
    sec = "0" + sec;
  }
  var ampm = "AM";
  if (h >= 12) {
    ampm = "PM";
  }
  if (h > 12) {
    h = h - 12;
  }
  if (h == 0) {
    h = 12;
  }

  loginLogs.push({
    email: user.email,
    role: user.role,
    date: todayString(),
    time: h + ":" + m + ":" + sec + " " + ampm
  });
  saveData();
}



// ================= TEACHER STUFF =================

// teacher and useradmin can both use the teacher page
function canDoTeacherStuff() {
  if (currentUser == null) {
    return false;
  }
  return currentUser.role == "teacher" || currentUser.role == "useradmin";
}

// create a new room or update the room being edited
function saveRoom() {
  if (canDoTeacherStuff() == false) {
    alert("Only teacher can do this!");
    return;
  }

  var name = document.getElementById("roomName").value;
  var capacity = document.getElementById("capacity").value;
  var price = document.getElementById("price").value;
  var promo = document.getElementById("promoCode").value;
  var discount = document.getElementById("discount").value;

  // check the inputs
  if (name == "" || capacity == "" || price == "") {
    document.getElementById("roomMsg").innerHTML = "Please fill in room name, capacity and price!";
    return;
  }
  if (Number(capacity) < 1 || Number(price) < 0) {
    document.getElementById("roomMsg").innerHTML = "Capacity or price is wrong!";
    return;
  }
  if (promo != "" && (discount == "" || Number(discount) < 1 || Number(discount) > 100)) {
    document.getElementById("roomMsg").innerHTML = "Please enter a discount between 1 and 100 for the promo code!";
    return;
  }
  if (promo == "") {
    discount = 0;
  }

  var message = "";

  if (editIndex == -1) {
    // new room
    var room = {
      id: Date.now(),
      name: name,
      capacity: Number(capacity),
      price: Number(price),
      promo: promo.toUpperCase(),
      discount: Number(discount),
      launched: false
    };
    rooms.push(room);
    message = "Room created! Click Launch so students can book it.";
  } else {
    // update old room
    rooms[editIndex].name = name;
    rooms[editIndex].capacity = Number(capacity);
    rooms[editIndex].price = Number(price);
    rooms[editIndex].promo = promo.toUpperCase();
    rooms[editIndex].discount = Number(discount);
    message = "Room updated!";
  }

  saveData();
  clearForm();
  showRooms();
  document.getElementById("roomMsg").innerHTML = message;
}

function clearForm() {
  document.getElementById("roomName").value = "";
  document.getElementById("capacity").value = "";
  document.getElementById("price").value = "";
  document.getElementById("promoCode").value = "";
  document.getElementById("discount").value = "";
  document.getElementById("roomMsg").innerHTML = "";
  editIndex = -1;
  document.getElementById("saveRoomBtn").innerHTML = "Create Room";
}

// show all rooms in the table for teacher
function showRooms() {
  var html = "<tr><th>Room</th><th>Capacity</th><th>Price per hour</th><th>Promo</th><th>Status</th><th>Action</th></tr>";

  if (rooms.length == 0) {
    html = html + "<tr><td colspan='6'>No rooms yet</td></tr>";
  }

  for (var i = 0; i < rooms.length; i++) {
    var status = "Not Launched";
    if (rooms[i].launched == true) {
      status = "Launched";
    }

    var promoText = "-";
    if (rooms[i].promo != "") {
      promoText = rooms[i].promo + " (" + rooms[i].discount + "% off)";
    }

    html = html + "<tr>";
    html = html + "<td>" + rooms[i].name + "</td>";
    html = html + "<td>" + rooms[i].capacity + " students</td>";
    html = html + "<td>$" + rooms[i].price + "</td>";
    html = html + "<td>" + promoText + "</td>";
    html = html + "<td>" + status + "</td>";
    html = html + "<td>";
    if (rooms[i].launched == false) {
      html = html + "<button onclick='launchRoom(" + i + ")'>Launch</button> ";
    }
    html = html + "<button onclick='editRoom(" + i + ")'>Edit</button> ";
    html = html + "<button onclick='deleteRoom(" + i + ")'>Delete</button>";
    html = html + "</td>";
    html = html + "</tr>";
  }

  document.getElementById("roomTable").innerHTML = html;
}

// teacher can see every booking
function showAllBookings() {
var html = "<tr><th>Student</th><th>Date</th><th>Time</th><th>Rooms</th><th>Total</th><th>Action</th></tr>";

if (bookings.length == 0) {
html = html + "<tr><td colspan='6'>No bookings yet</td></tr>";
}

for (var i = 0; i < bookings.length; i++) {
var roomText = "";
var total = 0;
for (var r = 0; r < bookings[i].rooms.length; r++) {
roomText = roomText + bookings[i].rooms[r].name + "<br>";
total = total + bookings[i].rooms[r].price;
}
html = html + "<tr>";
html = html + "<td>" + bookings[i].student + "</td>";
html = html + "<td>" + bookings[i].date + "</td>";
html = html + "<td>" + toTime(bookings[i].start) + " - " + toTime(bookings[i].end) + "</td>";
html = html + "<td>" + roomText + "</td>";
html = html + "<td>$" + total.toFixed(2) + "</td>";
html = html + "<td><button onclick='teacherCancelBooking(" + bookings[i].id + ")'>Cancel</button></td>";
html = html + "</tr>";
}

document.getElementById("allBookingsTable").innerHTML = html;
}
// teacher cancel any student's booking
function teacherCancelBooking(id) {
if (canDoTeacherStuff() == false) {
alert("Only teacher can do this!");
return;
}

var index = -1;
for (var i = 0; i < bookings.length; i++) {
if (bookings[i].id == id) {
index = i;
}
}
if (index == -1) {
return;
}

var b = bookings[index];
var msg = "Cancel " + b.student + "'s booking on " + b.date + " (" +
toTime(b.start) + " - " + toTime(b.end) + ")?";
if (confirm(msg) == false) {
return;
}

bookings.splice(index, 1);
saveData();
showAllBookings();
document.getElementById("roomMsg").innerHTML = "Booking cancelled!";
}
// launch = students can see the room now
function launchRoom(i) {
  if (canDoTeacherStuff() == false) {
    alert("Only teacher can do this!");
    return;
  }
  rooms[i].launched = true;
  saveData();
  showRooms();
  document.getElementById("roomMsg").innerHTML = rooms[i].name + " is launched!";
}

// put the room details back into the form so teacher can change it
function editRoom(i) {
  if (canDoTeacherStuff() == false) {
    alert("Only teacher can do this!");
    return;
  }
  document.getElementById("roomName").value = rooms[i].name;
  document.getElementById("capacity").value = rooms[i].capacity;
  document.getElementById("price").value = rooms[i].price;
  document.getElementById("promoCode").value = rooms[i].promo;
  if (rooms[i].promo != "") {
    document.getElementById("discount").value = rooms[i].discount;
  } else {
    document.getElementById("discount").value = "";
  }
  editIndex = i;
  document.getElementById("saveRoomBtn").innerHTML = "Update Room";
  document.getElementById("roomMsg").innerHTML = "Editing " + rooms[i].name;
}

function deleteRoom(i) {
  if (canDoTeacherStuff() == false) {
    alert("Only teacher can do this!");
    return;
  }

  var roomId = rooms[i].id;

  // check if any booking got this room
  var hasBooking = false;
  for (var b = 0; b < bookings.length; b++) {
    for (var r = 0; r < bookings[b].rooms.length; r++) {
      if (bookings[b].rooms[r].id == roomId) {
        hasBooking = true;
      }
    }
  }

  var msg = "Are you sure you want to delete " + rooms[i].name + "?";
  if (hasBooking == true) {
    msg = "This room has bookings! Delete anyway?";
  }
  if (confirm(msg) == false) {
    return;
  }

  // remove the room from any booking that has it
  for (var b = bookings.length - 1; b >= 0; b--) {
    for (var r = bookings[b].rooms.length - 1; r >= 0; r--) {
      if (bookings[b].rooms[r].id == roomId) {
        bookings[b].rooms.splice(r, 1);
      }
    }
    // if booking got no more rooms then remove the booking
    if (bookings[b].rooms.length == 0) {
      bookings.splice(b, 1);
    }
  }

  rooms.splice(i, 1);
  clearForm();
  saveData();
  showRooms();
  showAllBookings();
  document.getElementById("roomMsg").innerHTML = "Room deleted!";
}


// ================= STUDENT STUFF =================

// put the start times (9am to 7:30pm) into the dropdown
function setupBookingForm() {
  var html = "";
  for (var m = OPEN_TIME; m < CLOSE_TIME; m = m + 30) {
    html = html + "<option value='" + m + "'>" + toTime(m) + "</option>";
  }
  document.getElementById("startTime").innerHTML = html;
  document.getElementById("bookDate").min = todayString();
  if (document.getElementById("bookDate").value == "") {
    document.getElementById("bookDate").value = todayString();
  }
}

// show launched rooms and if they are free for the chosen time
function showAvailableRooms() {
  var date = document.getElementById("bookDate").value;
  var start = Number(document.getElementById("startTime").value);
  var duration = Number(document.getElementById("duration").value);
  var end = start + duration;
  var table = document.getElementById("availableTable");

  if (date == "") {
    table.innerHTML = "<tr><td>Please choose a date first</td></tr>";
    return;
  }
  if (end > CLOSE_TIME) {
    table.innerHTML = "<tr><td>Rooms close at 8:00 PM. Please choose an earlier time or shorter duration.</td></tr>";
    return;
  }

  // if modifying, get the rooms already in that booking so we tick them
  var myRoomIds = [];
  if (modifyBookingId != -1) {
    for (var b = 0; b < bookings.length; b++) {
      if (bookings[b].id == modifyBookingId) {
        for (var r = 0; r < bookings[b].rooms.length; r++) {
          myRoomIds.push(bookings[b].rooms[r].id);
        }
      }
    }
  }

  var html = "<tr><th>Select</th><th>Room</th><th>Capacity</th><th>Price per hour</th><th>Cost for " + (duration / 60) + " hr</th></tr>";
  var count = 0;

  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].launched == false) {
      continue;
    }

    var cost = rooms[i].price * duration / 60;
    var free = isRoomFree(rooms[i].id, date, start, end, modifyBookingId);

    html = html + "<tr>";
    if (free == true) {
      var checked = "";
      if (myRoomIds.indexOf(rooms[i].id) != -1) {
        checked = "checked";
      }
      html = html + "<td><input type='checkbox' class='roomCheck' value='" + rooms[i].id + "' " + checked + "></td>";
    } else {
      html = html + "<td>Booked</td>";
    }
    html = html + "<td>" + rooms[i].name + "</td>";
    html = html + "<td>" + rooms[i].capacity + " students</td>";
    html = html + "<td>$" + rooms[i].price + "</td>";
    html = html + "<td>$" + cost.toFixed(2) + "</td>";
    html = html + "</tr>";
    count++;
  }

  if (count == 0) {
    html = html + "<tr><td colspan='5'>No rooms available</td></tr>";
  }

  table.innerHTML = html;
}

// book the ticked rooms (or update booking if modifying)
function bookRooms() {
  if (currentUser == null || currentUser.role != "student") {
    alert("Only student can do this!");
    return;
  }

  var date = document.getElementById("bookDate").value;
  var start = Number(document.getElementById("startTime").value);
  var duration = Number(document.getElementById("duration").value);
  var end = start + duration;

  // check date and time
  if (date == "") {
    document.getElementById("bookMsg").innerHTML = "Please choose a date!";
    return;
  }
  if (date < todayString()) {
    document.getElementById("bookMsg").innerHTML = "Cannot book a date that already passed!";
    return;
  }
  if (duration < 30 || duration > 120) {
    document.getElementById("bookMsg").innerHTML = "Booking must be between 30 mins and 2 hours!";
    return;
  }
  if (start < OPEN_TIME || end > CLOSE_TIME) {
    document.getElementById("bookMsg").innerHTML = "Rooms are only open from 9:00 AM to 8:00 PM!";
    return;
  }

  var checkboxes = document.getElementsByClassName("roomCheck");
  var selected = [];
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked == true) {
      selected.push(Number(checkboxes[i].value));
    }
  }

  if (selected.length == 0) {
    document.getElementById("bookMsg").innerHTML = "Please select at least 1 room!";
    return;
  }
if (selected.length == 0) {
document.getElementById("bookMsg").innerHTML = "Please select at least 1 room!";
return;
}

if (selected.length > 1) {
document.getElementById("bookMsg").innerHTML = "You can only book 1 room for the same timing!";
return;
}

if (isStudentFree(currentUser.email, date, start, end, modifyBookingId) == false) {
document.getElementById("bookMsg").innerHTML = "You already have a booking at this time!";
return;
}

var promo = document.getElementById("studentPromo").value.toUpperCase();
  var promo = document.getElementById("studentPromo").value.toUpperCase();
  var promoUsed = false;
  var bookedRooms = [];
  var total = 0;

  for (var i = 0; i < selected.length; i++) {
    var room = findRoom(selected[i]);

    // double check nobody took the room
    if (isRoomFree(room.id, date, start, end, modifyBookingId) == false) {
      document.getElementById("bookMsg").innerHTML = room.name + " is already booked at that time!";
      return;
    }

    var price = room.price * duration / 60;

    // apply promo if the code matches this room
    if (promo != "" && promo == room.promo) {
      price = price - (price * room.discount / 100);
      promoUsed = true;
    }

    bookedRooms.push({ id: room.id, name: room.name, price: price });
    total = total + price;
  }

  if (promo != "" && promoUsed == false) {
    document.getElementById("bookMsg").innerHTML = "Promo code is invalid!";
    return;
  }

  if (modifyBookingId == -1) {
    // new booking
    var booking = {
      id: Date.now(),
      student: currentUser.email,
      date: date,
      start: start,
      end: end,
      rooms: bookedRooms,
      promo: promo
    };
    bookings.push(booking);
    document.getElementById("bookMsg").innerHTML = "Booking successful! Total: $" + total.toFixed(2);
  } else {
    // modify old booking
    for (var b = 0; b < bookings.length; b++) {
      if (bookings[b].id == modifyBookingId) {
        bookings[b].date = date;
        bookings[b].start = start;
        bookings[b].end = end;
        bookings[b].rooms = bookedRooms;
        bookings[b].promo = promo;
      }
    }
    modifyBookingId = -1;
    document.getElementById("bookBtn").innerHTML = "Book Selected Rooms";
    document.getElementById("stopModifyBtn").style.display = "none";
    document.getElementById("bookMsg").innerHTML = "Booking updated! New total: $" + total.toFixed(2);
  }

  document.getElementById("studentPromo").value = "";
  saveData();
  showAvailableRooms();
  showMyBookings();
}

// show the bookings of the student that logged in
function showMyBookings() {
  var html = "<tr><th>Booking ID</th><th>Date</th><th>Time</th><th>Rooms</th><th>Promo</th><th>Total</th><th>Action</th></tr>";
  var count = 0;

  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].student == currentUser.email) {
      var roomText = "";
      var total = 0;
      for (var r = 0; r < bookings[i].rooms.length; r++) {
        roomText = roomText + bookings[i].rooms[r].name + " ($" + bookings[i].rooms[r].price.toFixed(2) + ")<br>";
        total = total + bookings[i].rooms[r].price;
      }

      var promoText = "-";
      if (bookings[i].promo != "") {
        promoText = bookings[i].promo;
      }

      html = html + "<tr>";
      html = html + "<td>" + bookings[i].id + "</td>";
      html = html + "<td>" + bookings[i].date + "</td>";
      html = html + "<td>" + toTime(bookings[i].start) + " - " + toTime(bookings[i].end) + "</td>";
      html = html + "<td>" + roomText + "</td>";
      html = html + "<td>" + promoText + "</td>";
      html = html + "<td>$" + total.toFixed(2) + "</td>";
      html = html + "<td><button onclick='modifyBooking(" + bookings[i].id + ")'>Modify</button> ";
      html = html + "<button onclick='cancelBooking(" + bookings[i].id + ")'>Cancel</button></td>";
      html = html + "</tr>";
      count++;
    }
  }

  if (count == 0) {
    html = html + "<tr><td colspan='7'>No bookings yet</td></tr>";
  }

  document.getElementById("bookingTable").innerHTML = html;
}

// load the booking so student can change date, time or rooms
function modifyBooking(id) {
  if (currentUser == null || currentUser.role != "student") {
    alert("Only student can do this!");
    return;
  }
  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].id == id) {
      modifyBookingId = id;
      document.getElementById("bookDate").value = bookings[i].date;
      document.getElementById("startTime").value = bookings[i].start;
      document.getElementById("duration").value = bookings[i].end - bookings[i].start;
      document.getElementById("studentPromo").value = bookings[i].promo;
    }
  }
  document.getElementById("bookBtn").innerHTML = "Update Booking";
  document.getElementById("stopModifyBtn").style.display = "inline";
  document.getElementById("bookMsg").innerHTML = "Change the date, time or rooms then click Update Booking";
  showAvailableRooms();
}

function stopModify() {
  modifyBookingId = -1;
  document.getElementById("bookBtn").innerHTML = "Book Selected Rooms";
  document.getElementById("stopModifyBtn").style.display = "none";
  document.getElementById("studentPromo").value = "";
  document.getElementById("bookMsg").innerHTML = "";
  showAvailableRooms();
}

function cancelBooking(id) {
  if (currentUser == null) {
    alert("Please log in first!");
    return;
  }
  if (confirm("Are you sure you want to cancel this booking?") == false) {
    return;
  }

  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].id == id) {
      bookings.splice(i, 1);
      break;
    }
  }

  if (modifyBookingId == id) {
    stopModify();
  }

  saveData();
  showAvailableRooms();
  showMyBookings();
  document.getElementById("bookMsg").innerHTML = "Booking cancelled!";
}


// ================= USERADMIN STUFF =================

// switch between the Teacher Page tab and the Accounts tab (useradmin only)
function showTab(tab) {
  if (currentUser == null || currentUser.role != "useradmin") {
    return;
  }
  if (tab == "accounts") {
    document.getElementById("teacherPage").style.display = "none";
    document.getElementById("adminPage").style.display = "block";
    document.getElementById("teacherTabBtn").className = "";
    document.getElementById("accountsTabBtn").className = "activeTab";
    clearUserForm();
    showUsers();
  } else {
    document.getElementById("adminPage").style.display = "none";
    document.getElementById("teacherPage").style.display = "block";
    document.getElementById("teacherTabBtn").className = "activeTab";
    document.getElementById("accountsTabBtn").className = "";
    showRooms();
    showAllBookings();
  }
}

// find a user index using email
function findUserIndex(email) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      return i;
    }
  }
  return -1;
}

// create a new account, or update the email / password of the account being edited
function saveUser() {
  if (currentUser == null || currentUser.role != "useradmin") {
    alert("Only useradmin can do this!");
    return;
  }

  var email = document.getElementById("newEmail").value.trim().toLowerCase();
  var password = document.getElementById("newPassword").value;
  var role = document.getElementById("newRole").value;

  if (email == "" || password == "") {
    document.getElementById("userMsg").innerHTML = "Please fill in email and password!";
    return;
  }
  if (email.indexOf("@") == -1) {
    document.getElementById("userMsg").innerHTML = "Please enter a valid email!";
    return;
  }
  if (password.length < 4) {
    document.getElementById("userMsg").innerHTML = "Password must be at least 4 characters!";
    return;
  }

  // email cannot be used by another account
  var sameEmail = findUserIndex(email);
  if (sameEmail != -1 && sameEmail != editUserIndex) {
    document.getElementById("userMsg").innerHTML = "This email is already used by another account!";
    return;
  }

  var message = "";

  if (editUserIndex == -1) {
    // new account
    users.push({ email: email, password: password, role: role });
    message = "Account created for " + email + " (" + role + ")!";
  } else {
    // update old account (only email and password can change)
    var oldEmail = users[editUserIndex].email;
    users[editUserIndex].email = email;
    users[editUserIndex].password = password;

    // if email changed, update the student's bookings so they still see them
    if (oldEmail != email) {
      for (var b = 0; b < bookings.length; b++) {
        if (bookings[b].student == oldEmail) {
          bookings[b].student = email;
        }
      }
    }
    message = "Account updated for " + email + "!";
  }

  saveData();
  clearUserForm();
  showUsers();
  document.getElementById("userMsg").innerHTML = message;
}

// put the account details back into the form so useradmin can change it
function editUser(i) {
  if (currentUser == null || currentUser.role != "useradmin") {
    alert("Only useradmin can do this!");
    return;
  }
  document.getElementById("newEmail").value = users[i].email;
  document.getElementById("newPassword").value = users[i].password;
  document.getElementById("newRole").value = users[i].role;
  document.getElementById("newRole").disabled = true;  // role cannot change when editing
  editUserIndex = i;
  document.getElementById("saveUserBtn").innerHTML = "Update Account";
  document.getElementById("userMsg").innerHTML = "Editing " + users[i].email;
}

function clearUserForm() {
  document.getElementById("newEmail").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("newRole").value = "student";
  document.getElementById("newRole").disabled = false;
  document.getElementById("userMsg").innerHTML = "";
  editUserIndex = -1;
  document.getElementById("saveUserBtn").innerHTML = "Create Account";
}

// delete an account (and the bookings of that account)
function deleteUser(i) {
  if (currentUser == null || currentUser.role != "useradmin") {
    alert("Only useradmin can do this!");
    return;
  }
  if (users[i].role == "useradmin") {
    alert("Cannot delete a useradmin account!");
    return;
  }

  var email = users[i].email;

  // count the bookings of this account
  var bookingCount = 0;
  for (var b = 0; b < bookings.length; b++) {
    if (bookings[b].student == email) {
      bookingCount++;
    }
  }

  var msg = "Are you sure you want to delete " + email + "?";
  if (bookingCount > 0) {
    msg = email + " has " + bookingCount + " booking(s). Delete the account and the bookings?";
  }
  if (confirm(msg) == false) {
    return;
  }

  // remove the bookings of this account
  for (var b = bookings.length - 1; b >= 0; b--) {
    if (bookings[b].student == email) {
      bookings.splice(b, 1);
    }
  }

  users.splice(i, 1);
  saveData();
  clearUserForm();
  showUsers();
  document.getElementById("userMsg").innerHTML = "Account " + email + " deleted!";
}

// show all student and teacher accounts
function showUsers() {
  var html = "<tr><th>Email</th><th>Password</th><th>Type of User</th><th>Action</th></tr>";
  var count = 0;

  for (var i = 0; i < users.length; i++) {
    if (users[i].role == "useradmin") {
      continue;
    }
    html = html + "<tr>";
    html = html + "<td>" + users[i].email + "</td>";
    html = html + "<td>" + users[i].password + "</td>";
    html = html + "<td>" + users[i].role + "</td>";
    html = html + "<td><button onclick='editUser(" + i + ")'>Edit</button> ";
    html = html + "<button onclick='deleteUser(" + i + ")'>Delete</button></td>";
    html = html + "</tr>";
    count++;
  }

  if (count == 0) {
    html = html + "<tr><td colspan='4'>No accounts yet</td></tr>";
  }

  document.getElementById("userTable").innerHTML = html;
}

// show login logs (newest first), can filter by type of user and date
function showLoginLogs() {
  var roleFilter = document.getElementById("logRole").value;
  var dateFilter = document.getElementById("logDate").value;

  var html = "<tr><th>Date</th><th>Time</th><th>Email</th><th>Type of User</th></tr>";
  var count = 0;

  for (var i = loginLogs.length - 1; i >= 0; i--) {
    if (roleFilter != "all" && loginLogs[i].role != roleFilter) {
      continue;
    }
    if (dateFilter != "" && loginLogs[i].date != dateFilter) {
      continue;
    }
    html = html + "<tr>";
    html = html + "<td>" + loginLogs[i].date + "</td>";
    html = html + "<td>" + loginLogs[i].time + "</td>";
    html = html + "<td>" + loginLogs[i].email + "</td>";
    html = html + "<td>" + loginLogs[i].role + "</td>";
    html = html + "</tr>";
    count++;
  }

  if (count == 0) {
    html = html + "<tr><td colspan='4'>No login logs</td></tr>";
  }

  document.getElementById("logTable").innerHTML = html;
}

// open the login logs pop up
function openLogs() {
  if (currentUser == null || currentUser.role != "useradmin") {
    alert("Only useradmin can do this!");
    return;
  }
  showLoginLogs();
  document.getElementById("logModal").style.display = "block";
}

// close the login logs pop up
function closeLogs() {
  document.getElementById("logModal").style.display = "none";
}

// close the pop up when click the dark area outside the box
function closeLogsOutside(event) {
  if (event.target.id == "logModal") {
    closeLogs();
  }
}

function clearLogFilter() {
  document.getElementById("logRole").value = "all";
  document.getElementById("logDate").value = "";
  showLoginLogs();
}
