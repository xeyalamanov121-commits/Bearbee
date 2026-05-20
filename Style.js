body{
  margin:0;
  background:#111;
  font-family:Arial;
  color:white;
}

.table{
  width:100%;
  height:100vh;
  background:#14532d;
  border-radius:50px;
  position:relative;
  overflow:hidden;
}

.player{
  position:absolute;
  left:50%;
  transform:translateX(-50%);
  text-align:center;
}

.top-player{
  top:30px;
}

.bottom-player{
  bottom:30px;
}

.cards{
  display:flex;
  gap:10px;
  justify-content:center;
  margin-top:10px;
}

.card{
  width:70px;
  height:100px;
  background:white;
  color:black;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  font-weight:bold;
}

.back{
  background:#1e3a8a;
}

.community{
  display:flex;
  gap:10px;
  justify-content:center;
  margin-top:250px;
}

.pot{
  text-align:center;
  margin-top:20px;
  font-size:28px;
}

.actions{
  margin-top:20px;
}

button{
  padding:12px 20px;
  border:none;
  border-radius:10px;
  margin:5px;
  background:gold;
  font-weight:bold;
  cursor:pointer;
}
