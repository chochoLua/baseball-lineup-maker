String.prototype.toChosung = function () {
    var cho, code, i, j, k, len, result;
    cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    result = '';
    for (j = k = 0, len = this.length; k < len; j = ++k) {
        i = this[j];
        code = this.charCodeAt(j) - 44032;
        result += code > -1 && code < 11172 ? cho[Math.floor(code / 588)] : i;
    }
    return result;
};

if (!Crypto.randomUUID) {
    Crypto.randomUUID = function () {
        var hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return hex;
    };
}

function parseWon(amount) {
    if (typeof amount === 'string') {
        amount = parseInt(amount.replace(/[^0-9]/g, '')) || 0;
    }

    let isMinus = amount < 0;
    amount = Math.abs(amount);
    if (amount < 10000) return (isMinus ? '-' : '') + amount + '원';

    let result = '';

    // 억 (100,000,000)
    const eok = Math.floor(amount / 100000000);
    let remainder = amount % 100000000;

    if (eok > 0) result += eok + '억';

    // 천만 (10,000,000)
    const cheonman = Math.floor(remainder / 10000000);
    remainder = remainder % 10000000;

    if (cheonman > 0) result += cheonman + '천만';

    // 만 (10,000)
    const man = Math.floor(remainder / 10000);

    if (man > 0) result += man + '만';

    return (isMinus ? '-' : '') + result || '0원';
}

const players = {
    positions: [],
    current: '',
    searchText: '',
    sortType: 0,
    init(positions) {
        this.positions = positions;
        this.current = Object.keys(this.positions)[0];
        console.log('Players initialized with positions:', this.positions);

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (event) => {
            this.searchText = event.target.value.trim();
            this.render();
        });

        const posTab = document.getElementById('posTab');
        posTab.innerHTML = '';
        Object.keys(this.positions).forEach(position => {
            const li = document.createElement('li');
            li.textContent = position;
            if (this.current === position) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => {
                document.querySelectorAll('.posTab li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                this.current = position;

                this.render();
            });
            posTab.appendChild(li);
        });
    },
    parseDollar(salary) {
        if (salary >= 10000) {
            return (salary / 10000).toLocaleString('ko-KR') + '만 달러';
        }
        return salary.toLocaleString('ko-KR') + '달러';
    },
    parseWon(salary) {
        if (salary >= 100000000) {
            return (salary / 100000000).toLocaleString('ko-KR') + '억원';
        }
        else if (salary >= 10000) {
            return Math.floor(salary / 10000).toLocaleString('ko-KR') + '만원';
        }
        return salary.toLocaleString('ko-KR') + '원';
    },
    render() {
        document.getElementById('playerList').innerHTML = '';
        this.positions[this.current]
            .filter(player => {
                return parseInt(player.salary.replace(/[^0-9]/g, '')) > 0 && player.name;
            })
            .sort((a, b) => {
                if (this.sortType === 0) {
                    return a.name.localeCompare(b.name);
                }
                else if (this.sortType === 1) {
                    return b.salaryInt - a.salaryInt;
                }
                return a.salaryInt - b.salaryInt;
            }).forEach(player => {
                document.querySelector('.order-type').innerHTML = `정렬 : ${players.sortType == 0 ? '이름순' : (players.sortType === 1 ? '연봉 높은순' : '연봉 낮은순')}`
                if (this.searchText && !(player.name.includes(this.searchText) || player.chosung.includes(this.searchText))) {
                    return;
                }

                const salary = [];
                if (player.salaryType === '달러') {
                    salary.push(this.parseDollar(player.salaryIntDollar));
                    salary.push(this.parseWon(player.salaryInt));
                }
                else {
                    salary.push(this.parseWon(player.salaryInt));
                }


                const playerItem = document.createElement('div');
                playerItem.classList.add('player-item');
                playerItem.draggable = true;
                playerItem.innerHTML = `
                    <img src="${player.imageUrl || 'https://placehold.co/50'}" alt="Player Image">
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-salary">${salary.join(' ≒ ')}</div>
                    </div>
                `;

                // 드래그 시작 시 플레이어 데이터 저장
                playerItem.addEventListener('dragstart', (e) => {
                    main.draggedPlayer = {
                        uuid: player.uuid,
                        name: player.name,
                        salaryInt: player.salaryInt,
                        salaryIntDollar: player.salaryIntDollar,
                        position: player.position,
                        teamLogoUrl: player.teamLogoUrl,
                    };
                    e.dataTransfer.effectAllowed = 'move';
                });

                playerItem.addEventListener('dragend', () => {
                    main.draggedPlayer = null;
                });

                document.getElementById('playerList').appendChild(playerItem);
            });
    }
}

const main = {
    draggedPlayer: null,
    players: {},
    render() {
        ['LF', 'CF', 'RF', 'B1', 'B2', 'B3', 'SS', 'C', 'SP', 'RP', 'CP', 'C', 'DH'].forEach(positionId => {
            const posItem = document.getElementById(positionId);
            if (posItem) {
                const nameEl = posItem.querySelector('.name');
                const salaryEl = posItem.querySelector('.salary');

                const player = this.players[positionId];
                if (nameEl) nameEl.innerHTML = player ? `<img style="width:60px;" src="${player.teamLogoUrl}"/><span>${player.name}</span>` : '';
                if (salaryEl) salaryEl.textContent = player && player.salaryInt ? players.parseWon(player.salaryInt) : '';
            }
        });

        const salaryList = document.querySelectorAll('.salary');
        salaryList.forEach(salary => {
            salary.style.display = salary.textContent.trim() === '' ? 'none' : 'block';
        });

        const totalSalary = Object.values(this.players).reduce((sum, player) => sum + (player ? player.salaryInt : 0), 0);
        document.getElementById('totalSalary').textContent = parseWon(totalSalary);

        const salaryCap = document.getElementById('salaryCap');
        if (salaryCap) {
            const capAmount = 990_000_000; // 예시로 10억 원을 상한선으로 설정
            salaryCap.textContent = `${parseWon(capAmount - totalSalary)}`;
            salaryCap.style.color = totalSalary > capAmount ? '#e90000' : '';
        }

    },
    initDragDrop() {
        // position-item에 드래그 오버 및 드롭 이벤트 리스너 추가
        document.querySelectorAll('.position-item').forEach(posItem => {
            posItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                posItem.style.backgroundColor = 'rgba(180, 101, 101, 0.3)';
            });

            posItem.addEventListener('dragleave', () => {
                posItem.style.backgroundColor = '';
            });

            posItem.addEventListener('drop', (e) => {
                e.preventDefault();
                posItem.style.backgroundColor = '';
                if (this.draggedPlayer) {
                    this.onPlayerDropped(posItem, this.draggedPlayer);
                }
            });
        });
    },

    onPlayerDropped(positionItem, playerData) {
        console.log('Player dropped on position:', {
            position: positionItem.id,
            player: playerData
        });

        Object.entries(this.players).forEach(([key, player]) => {
            if (player && player.name === playerData.name && player.uuid === playerData.uuid) {
                delete this.players[key];
            }
        });

        this.players[positionItem.id] = playerData;
        this.render();

        return {
            positionId: positionItem.id,
            playerName: playerData.name,
            playerSalary: playerData.salaryInt,
            teamLogoUrl: playerData.teamLogoUrl,
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const search = new URLSearchParams(location.search.substring(1));
    const streamerId = search.get('streamer') ?? 'tachocho';
    document.querySelector('#soop').style.display = streamerId === 'tachocho' ? 'inline' : 'none';
    document.querySelector('#logo').src = `img/${streamerId}.png`

    // kbo.json 데이터 로드
    fetch('/baseball-lineup-maker/data/kbo.json')
    // fetch('/data/kbo.json')
        .then(response => response.json())
        .then(data => {
            const elHint = document.querySelector('.hint');
            if (elHint) {
                elHint.textContent = `총 ${Object.values(data.positions).reduce((sum, players) => sum + players.length, 0)}명 선수 로드 완료 [${data.source.kbo.sourceDate} 데이터]`;
            }
            Object.values(data.positions).forEach(players => {
                players
                    .forEach(player => {
                        player.uuid = Crypto.randomUUID();
                        player.chosung = player.name.toChosung();
                        player.salaryType = player.salary.includes('달러') ? '달러' : '원';
                        player.salaryInt = parseInt(player.salary.replace(/[^0-9]/g, '')) * (player.salary.includes('달러') ? 1500 : 10000);
                        if (player.salaryType === '달러') {
                            player.salaryIntDollar = parseInt(player.salary.replace(/[^0-9]/g, ''))
                        }
                    });
            });

            window.addEventListener('click', (e) => {
                if (e.target.closest('position-item') && this.players[e.target.id]) {
                    delete this.players[e.target.id];
                    this.render();
                }
                else if (e.target.id === 'order') {
                    players.sortType = (players.sortType + 1) % 3;
                    players.render();
                }
            })
            players.init(data.positions);
            players.render();

            // 드래그 드롭 초기화
            main.initDragDrop();

            main.render();
        })
        .catch(error => console.error('Error loading kbo.json:', error));
});