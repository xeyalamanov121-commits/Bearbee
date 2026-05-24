import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// Supabase client qoşulması
const supabase = createClient(
  "https://ywpqvvriakbbhvrtpvso.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)

let finish = 340
let positions = [0,0,0]
let racing = false
let balance = 20
let adminBalance = 0
let playerCounts = [0,0,0,0]
const minPlayers = 3

const roomImages = [
  "room1.png",
  "room2.png",
  "room3.png",
  "room4.png"
]

let roomsContainer = document.getElementById("rooms")
for (let i = 1; i <= 4; i++) {
  let price = i
  let div = document.createElement("div")
  div.className = "room"
  div.style.backgroundImage = `url(${roomImages[i-1]})`
  div.innerHTML = `<h2>Room ${i}</h2><p>Entry: ${price} TON</p><p id="count${i}">Players: 0</p>`
  div.onclick = () => joinRoom(i, price, "Player"+Math.floor(Math.random()*1000))
  roomsContainer.appendChild(div)
}

// Oyunçu otağa qoşulur
async function joinRoom(roomId, price, playerName) {
  if (balance < price) {
    document.getElementById("result").innerText = "⚠️ Not enough balance!"
    return
  }
  balance -= price
  document.getElementById("balance").innerText = balance

  const { error } = await supabase
    .from("players")
    .insert([{ room_id: roomId, name: playerName }])
  if (error) console.error(error)
}

// Realtime subscription
supabase
  .channel("room-changes")
  .on("postgres_changes", 
      { event: "INSERT", schema: "public", table: "players" }, 
      payload => {
        console.log("Yeni oyunçu:", payload.new)
        checkStartRace(payload.new.room_id)
      })
  .subscribe()

// Minimum oyunçu sayı yoxlanır
async function checkStartRace(roomId) {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)

  document.getElementById("count"+roomId).innerText = "Players: " + data.length

  if (data.length >= minPlayers) {
    startRace(roomId, roomId, data.length)
  } else {
    document.getElementById("result").innerText = 
      `⏳ Waiting... Room ${roomId} has ${data.length} players (need ${minPlayers})`
  }
}

// Yarış mexanikası
function startRace(room, price, players) {
  positions = [0,0,0]
  racing = true
  document.getElementById("track").style.display = "block"
  document.getElementById("result").innerText = `🏁 Race started in Room ${room}!`

  let totalPrize = price * players
  let interval = setInterval(() => {
    for (let i = 0; i < players; i++) {
      let step = Math.floor(Math.random() * 20) + (5 + Math.floor(Math.random()*10))
      positions[i] += step
      if (document.getElementById("car"+(i+1))) {
        document.getElementById("car" + (i + 1)).style.bottom = positions[i] + "px"
      }
      if (positions[i] >= finish) {
        clearInterval(interval)
        let winnerShare = Math.floor(totalPrize * 0.6)
        let adminShare = totalPrize - winnerShare
        balance += winnerShare
        adminBalance += adminShare
        document.getElementById("balance").innerText = balance
        document.getElementById("adminBalance").innerText = adminBalance
        document.getElementById("result").innerText =
          `🥇 Winner: Car ${i+1} | +${winnerShare} TON (Admin +${adminShare} TON)`
        racing = false
      }
    }
  }, 200)
        }
