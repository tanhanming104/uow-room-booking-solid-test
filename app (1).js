// UOW Room Booking System
// room booking project

// users (hardcoded for now)
var users = [
  { email: "teacher@uow", password: "1234", role: "teacher" },
  { email: "student@uow", password: "1234", role: "student" }
];

var rooms = [];
var bookings = [];
var currentUser = null;
var editIndex = -1;        // -1 means not editing a room
var modifyBookingId = -1;  // -1 means not modifying a booking

// load data from localstorage if got
if (localStorage.getItem("rooms") != null) {
  rooms = JSON.parse(localStorage.getItem("rooms"));
}
if (localStorage.getItem("bookings") != null) {
  bookings = JSON.parse(localStorage.getItem("bookings"));
}

function saveData() {
  localStorage.setItem("rooms", JSON.stringify(rooms));
  localStorage.setItem("bookings", JSON.stringify(bookings));
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


// ================= LOGIN =================

function login() {
  var email = document.getElementById("email").value;
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

  // teacher and student see different pages
  if (currentUser.role == "teacher") {
    document.getElementById("teacherPage").style.display = "block";
    showRooms();
  } else {
    document.getElementById("studentPage").style.display = "block";
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
  document.getElementById("roomMsg").innerHTML = "";
  document.getElementById("bookMsg").innerHTML = "";
  document.getElementById("teacherPage").style.display = "none";
  document.getElementById("studentPage").style.display = "none";
  document.getElementById("loginPage").style.display = "block";
}


// ================= TEACHER STUFF =================

// create a new room OR update the room being edited
function saveRoom() {
  if (currentUser == null || currentUser.role != "teacher") {
    alert("Only teacher can do this!");
    return;
  }

  var name = document.getElementById("roomName").value;
  var capacity = document.getElementById("capacity").value;
  var price = document.getElementById("price").value;
  var date = document.getElementById("date").value;
  var start = document.getElementById("startTime").value;
  var end = document.getElementById("endTime").value;
  var promo = document.getElementById("promoCode").value;
  var discount = document.getElementById("discount").value;

  // check the inputs
  if (name == "" || capacity == "" || price == "" || date == "" || start == "" || end == "") {
    document.getElementById("roomMsg").innerHTML = "Please fill in all the fields!";
    return;
  }
  if (Number(capacity) < 1 || Number(price) < 0) {
    document.getElementById("roomMsg").innerHTML = "Capacity or price is wrong!";
    return;
  }
  if (start >= end) {
    document.getElementById("roomMsg").innerHTML = "End time must be after start time!";
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
      date: date,
      start: start,
      end: end,
      promo: promo.toUpperCase(),
      discount: Number(discount),
      launched: false,
      bookedBy: ""
    };
    rooms.push(room);
    message = "Room created! Click Launch so students can book it.";
  } else {
    // update old room
    rooms[editIndex].name = name;
    rooms[editIndex].capacity = Number(capacity);
    rooms[editIndex].price = Number(price);
    rooms[editIndex].date = date;
    rooms[editIndex].start = start;
    rooms[editIndex].end = end;
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
  document.getElementById("date").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("promoCode").value = "";
  document.getElementById("discount").value = "";
  document.getElementById("roomMsg").innerHTML = "";
  editIndex = -1;
  document.getElementById("saveRoomBtn").innerHTML = "Create Room";
}

// show all rooms in the table for teacher
function showRooms() {
  var html = "<tr><th>Room</th><th>Date</th><th>Time</th><th>Capacity</th><th>Price</th><th>Promo</th><th>Status</th><th>Action</th></tr>";

  if (rooms.length == 0) {
    html = html + "<tr><td colspan='8'>No rooms yet</td></tr>";
  }

  for (var i = 0; i < rooms.length; i++) {
    var status = "Not Launched";
    if (rooms[i].launched == true) {
      status = "Launched";
    }
    if (rooms[i].bookedBy != "") {
      status = status + " (Booked)";
    }

    var promoText = "-";
    if (rooms[i].promo != "") {
      promoText = rooms[i].promo + " (" + rooms[i].discount + "% off)";
    }

    html = html + "<tr>";
    html = html + "<td>" + rooms[i].name + "</td>";
    html = html + "<td>" + rooms[i].date + "</td>";
    html = html + "<td>" + rooms[i].start + " - " + rooms[i].end + "</td>";
    html = html + "<td>" + rooms[i].capacity + "</td>";
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

// launch = students can see the room now
function launchRoom(i) {
  if (currentUser == null || currentUser.role != "teacher") {
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
  if (currentUser == null || currentUser.role != "teacher") {
    alert("Only teacher can do this!");
    return;
  }
  document.getElementById("roomName").value = rooms[i].name;
  document.getElementById("capacity").value = rooms[i].capacity;
  document.getElementById("price").value = rooms[i].price;
  document.getElementById("date").value = rooms[i].date;
  document.getElementById("startTime").value = rooms[i].start;
  document.getElementById("endTime").value = rooms[i].end;
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
  if (currentUser == null || currentUser.role != "teacher") {
    alert("Only teacher can do this!");
    return;
  }

  var msg = "Are you sure you want to delete " + rooms[i].name + "?";
  if (rooms[i].bookedBy != "") {
    msg = "This room is booked by a student! Delete anyway?";
  }
  if (confirm(msg) == false) {
    return;
  }

  // remove the room from any booking that has it
  var roomId = rooms[i].id;
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
  document.getElementById("roomMsg").innerHTML = "Room deleted!";
}


// ================= STUDENT STUFF =================

// show launched rooms that nobody booked yet
function showAvailableRooms() {
  // if modifying, get the rooms already in that booking
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

  var html = "<tr><th>Select</th><th>Room</th><th>Date</th><th>Time</th><th>Capacity</th><th>Price</th><th>Promo</th></tr>";
  var count = 0;

  for (var i = 0; i < rooms.length; i++) {
    var isMine = myRoomIds.indexOf(rooms[i].id) != -1;

    if ((rooms[i].launched == true && rooms[i].bookedBy == "") || isMine) {
      var checked = "";
      if (isMine) {
        checked = "checked";
      }
      var hasPromo = "No";
      if (rooms[i].promo != "") {
        hasPromo = "Yes";
      }

      html = html + "<tr>";
      html = html + "<td><input type='checkbox' class='roomCheck' value='" + rooms[i].id + "' " + checked + "></td>";
      html = html + "<td>" + rooms[i].name + "</td>";
      html = html + "<td>" + rooms[i].date + "</td>";
      html = html + "<td>" + rooms[i].start + " - " + rooms[i].end + "</td>";
      html = html + "<td>" + rooms[i].capacity + "</td>";
      html = html + "<td>$" + rooms[i].price + "</td>";
      html = html + "<td>" + hasPromo + "</td>";
      html = html + "</tr>";
      count++;
    }
  }

  if (count == 0) {
    html = html + "<tr><td colspan='7'>No rooms available</td></tr>";
  }

  document.getElementById("availableTable").innerHTML = html;
}

// book the ticked rooms (or update booking if modifying)
function bookRooms() {
  if (currentUser == null || currentUser.role != "student") {
    alert("Only student can do this!");
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

  var promo = document.getElementById("studentPromo").value.toUpperCase();
  var promoUsed = false;
  var bookedRooms = [];
  var total = 0;

  for (var i = 0; i < selected.length; i++) {
    var room = findRoom(selected[i]);
    var price = room.price;

    // apply promo if the code matches this room
    if (promo != "" && promo == room.promo) {
      price = price - (price * room.discount / 100);
      promoUsed = true;
    }

    bookedRooms.push({
      id: room.id,
      name: room.name,
      date: room.date,
      start: room.start,
      end: room.end,
      price: price
    });
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
      rooms: bookedRooms,
      promo: promo
    };
    bookings.push(booking);
    for (var i = 0; i < selected.length; i++) {
      findRoom(selected[i]).bookedBy = currentUser.email;
    }
    document.getElementById("bookMsg").innerHTML = "Booking successful! Total: $" + total.toFixed(2);
  } else {
    // modify old booking
    for (var b = 0; b < bookings.length; b++) {
      if (bookings[b].id == modifyBookingId) {
        // free the old rooms first
        for (var r = 0; r < bookings[b].rooms.length; r++) {
          var oldRoom = findRoom(bookings[b].rooms[r].id);
          if (oldRoom != null) {
            oldRoom.bookedBy = "";
          }
        }
        bookings[b].rooms = bookedRooms;
        bookings[b].promo = promo;
      }
    }
    for (var i = 0; i < selected.length; i++) {
      findRoom(selected[i]).bookedBy = currentUser.email;
    }
    modifyBookingId = -1;
    document.getElementById("bookBtn").innerHTML = "Book Selected Rooms";
    document.getElementById("bookMsg").innerHTML = "Booking updated! New total: $" + total.toFixed(2);
  }

  document.getElementById("studentPromo").value = "";
  saveData();
  showAvailableRooms();
  showMyBookings();
}

// show the bookings of the student that logged in
function showMyBookings() {
  var html = "<tr><th>Booking ID</th><th>Rooms</th><th>Promo</th><th>Total</th><th>Action</th></tr>";
  var count = 0;

  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].student == currentUser.email) {
      var roomText = "";
      var total = 0;
      for (var r = 0; r < bookings[i].rooms.length; r++) {
        var rm = bookings[i].rooms[r];
        roomText = roomText + rm.name + " (" + rm.date + ", " + rm.start + " - " + rm.end + ")<br>";
        total = total + rm.price;
      }

      var promoText = "-";
      if (bookings[i].promo != "") {
        promoText = bookings[i].promo;
      }

      html = html + "<tr>";
      html = html + "<td>" + bookings[i].id + "</td>";
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
    html = html + "<tr><td colspan='5'>No bookings yet</td></tr>";
  }

  document.getElementById("bookingTable").innerHTML = html;
}

// load the booking so student can change the rooms
function modifyBooking(id) {
  if (currentUser == null || currentUser.role != "student") {
    alert("Only student can do this!");
    return;
  }
  modifyBookingId = id;
  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].id == id) {
      document.getElementById("studentPromo").value = bookings[i].promo;
    }
  }
  document.getElementById("bookBtn").innerHTML = "Update Booking";
  document.getElementById("bookMsg").innerHTML = "Change the rooms you want then click Update Booking";
  showAvailableRooms();
}

function cancelBooking(id) {
  if (currentUser == null || currentUser.role != "student") {
    alert("Only student can do this!");
    return;
  }
  if (confirm("Are you sure you want to cancel this booking?") == false) {
    return;
  }

  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].id == id) {
      // make the rooms available again
      for (var r = 0; r < bookings[i].rooms.length; r++) {
        var room = findRoom(bookings[i].rooms[r].id);
        if (room != null) {
          room.bookedBy = "";
        }
      }
      bookings.splice(i, 1);
      break;
    }
  }

  if (modifyBookingId == id) {
    modifyBookingId = -1;
    document.getElementById("bookBtn").innerHTML = "Book Selected Rooms";
  }

  saveData();
  showAvailableRooms();
  showMyBookings();
  document.getElementById("bookMsg").innerHTML = "Booking cancelled!";
}
