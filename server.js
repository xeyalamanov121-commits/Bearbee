// Serverdəki 'players' obyektinə xal izləmə əlavə edirik
socket.on('updateScore', (score) => {
    if (players[socket.id]) {
        players[socket.id].score = score;
        io.emit('scoreBoard', players); // Hər kəs bir-birinin xalını görür
    }
});

// Qalibi elan etmə (Məsələn, hamı öldükdən sonra)
socket.on('checkWinner', () => {
    let winner = null;
    let maxScore = -1;
    let isDraw = false;

    // Xalları müqayisə edirik
    Object.values(players).forEach(p => {
        if (p.score > maxScore) {
            maxScore = p.score;
            winner = p.username;
            isDraw = false;
        } else if (p.score === maxScore && maxScore > 0) {
            isDraw = true;
        }
    });

    if (isDraw) {
        io.emit('gameResult', "HEÇ-HƏ! Yenidən başlayın!");
    } else {
        io.emit('gameResult', `Qalib: ${winner} (${maxScore} xal)`);
    }
});
