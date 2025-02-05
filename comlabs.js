var isButtonPressed = 0;
function showReservationInfo() {
    var bool;
    if(isButtonPressed == 0) {
        isButtonPressed = 1;
    }
    else if(isButtonPressed==1){
        isButtonPressed = 0;
    }
    console.log(isButtonPressed);

    return isButtonPressed;
}


function reserveDate() {
    var date = document.getElementById("reserve-date").value;
    var dateInfo = document.getElementById("date-info");
    dateInfo.removeChild(document.getElementById("reserve-date"));

    var dateEntry = document.createElement("p");
    dateEntry.id = ("new-date");
    dateEntry.classList.add("info");

    dateEntry.appendChild(document.createTextNode(date));
    dateInfo.appendChild(dateEntry);
}

function reserveTime() {
    var time = document.getElementById("reserve-time").value;
    var timeInfo = document.getElementById("time-info");
    timeInfo.removeChild(document.getElementById("reserve-time"));

    var timeEntry = document.createElement("p");
    timeEntry.id = ("new-time");
    timeEntry.classList.add("info");

    timeEntry.appendChild(document.createTextNode(time));
    timeInfo.appendChild(timeEntry);
    console.log(time);
}

function reserveRoom() {
    var room = document.getElementById("reserve-room").value;
    var roomInfo = document.getElementById("room-info");
    roomInfo.removeChild(document.getElementById("reserve-room"));

    var roomEntry = document.createElement("p");
    roomEntry.id = ("new-room")
    roomEntry.classList.add("info");

    roomEntry.appendChild(document.createTextNode(room));
    roomInfo.appendChild(roomEntry);

    console.log(room);
    
}

function reserveSeat() {
    var seat = document.getElementById("reserve-seat").value;
    var seatInfo = document.getElementById("seat-info");
    seatInfo.removeChild(document.getElementById("reserve-seat"));

    var seatEntry = document.createElement("p");
    seatEntry.id = ("new-seat")
    seatEntry.classList.add("info");

    seatEntry.appendChild(document.createTextNode(seat));
    seatInfo.appendChild(seatEntry);

    console.log(seat);
    
}

function resetDate() {
    var dateInfo = document.getElementById("date-info");
    dateInfo.removeChild(document.getElementById("new-date"));

    var newInputDate = document.createElement("input");
    newInputDate.id = ("reserve-date");
    newInputDate.classList.add("input-border");
    newInputDate.type = "date";
    dateInfo.appendChild(newInputDate);

    // let nextElement = document.getElementById("time-info");
    // form.insertBefore(newInputDate, nextElement);


  //  form.appendChild(newInputDate);
}


function resetTime() {
    var timeInfo = document.getElementById("time-info");
    timeInfo.removeChild(document.getElementById("new-time"));

    var newInputTime = document.createElement("input");
    newInputTime.id = ("reserve-time");
    newInputTime.classList.add("input-border");
    newInputTime.type = "time";
    timeInfo.appendChild(newInputTime);
}

function resetRoom() {
    var roomInfo = document.getElementById("room-info");
    roomInfo.removeChild(document.getElementById("new-room"));

    var newInputRoom = document.createElement("input");
    newInputRoom.id = ("reserve-room");
    newInputRoom.classList.add("input-border");
    newInputRoom.type = "text";
    roomInfo.appendChild(newInputRoom);
}

function resetSeat() {
    var seatInfo = document.getElementById("seat-info");
    seatInfo.removeChild(document.getElementById("new-seat"));

    var newInputSeat = document.createElement("input");
    newInputSeat.id = ("reserve-seat");
    newInputSeat.classList.add("input-border");
    newInputSeat.type = "text";
    seatInfo.appendChild(newInputSeat);
}

function OnSubmitButtonClicked() {
    var isButtonPressed = showReservationInfo();
    if(isButtonPressed == 1) {
        reserveDate();
        reserveTime();
        reserveRoom();
        reserveSeat();
       document.getElementById("submit-button").textContent = 'Back';
    }
    
    else {
        resetDate();
        resetTime();
        resetRoom();
        resetSeat();
        document.getElementById("submit-button").textContent = 'Submit';
    }

}

function checkForm(event) {
    var dateInput = document.getElementById("reserve-date").value;
    var timeInput = document.getElementById("reserve-time").value;

    if(dateInput === "" || timeInput === "") {
        alert("Please enter the necessary details."); 
        event.preventDefault(); 
    }
}

