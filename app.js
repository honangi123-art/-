
const RECENT_KEY = 'stoneAgeRecentSearches';

const defaultPetData = {
  "짜얄(kiketiti)": { initialCoefficient: 17, healthCoefficient: 25, attackCoefficient: 24, defenseCoefficient: 9, agilityCoefficient: 34 },
  "유미(lunya0519)": { initialCoefficient: 24, healthCoefficient: 36, attackCoefficient: 20, defenseCoefficient: 36, agilityCoefficient: 15 }
};

let petData = { ...defaultPetData };

function statusText(text){ document.getElementById('load-status').textContent = text; }

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecentSearch(name) {
  if (!name) return;
  let recent = getRecentSearches().filter(v => v !== name);
  recent.unshift(name);
  recent = recent.slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const wrap = document.getElementById('recent-list');
  wrap.innerHTML = '';
  const recent = getRecentSearches();
  if (!recent.length) {
    wrap.innerHTML = '<div class="hint">아직 최근 검색이 없습니다.</div>';
    return;
  }
  recent.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = name;
    btn.type = 'button';
    btn.addEventListener('click', () => selectPet(name));
    wrap.appendChild(btn);
  });
}

function getChosung(str) {
  const BASE_CODE = 0xAC00;
  const LAST_CODE = 0xD7A3;
  const CHOSUNG_LIST = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= BASE_CODE && code <= LAST_CODE) {
      const offset = code - BASE_CODE;
      const chosungIndex = Math.floor(offset / 588);
      result += CHOSUNG_LIST[chosungIndex];
    } else {
      result += str[i];
    }
  }
  return result;
}

function renderPetList() {
  const list = document.getElementById('pet-list');
  list.innerHTML = '';
  const names = Object.keys(petData).sort((a, b) => a.localeCompare(b, 'ko-KR'));
  if (!names.length) {
    list.innerHTML = '<div class="hint">등록된 페트가 없습니다.</div>';
    return;
  }
  names.forEach(name => {
    const pet = petData[name];
    const row = document.createElement('div');
    row.className = 'pet-entry';
    row.innerHTML = `
      <div>
        <div><strong>${name}</strong></div>
        <div class="pet-meta">IC ${pet.initialCoefficient} · 공 ${pet.attackCoefficient} / 방 ${pet.defenseCoefficient} / 순 ${pet.agilityCoefficient} / 체 ${pet.healthCoefficient}</div>
      </div>
      <div class="pet-entry-actions">
        <button class="btn primary" type="button">선택</button>
      </div>
    `;
    row.querySelector('button').addEventListener('click', () => selectPet(name));
    list.appendChild(row);
  });
}

function renderSuggestions(matches) {
  const wrap = document.getElementById('suggestions');
  wrap.innerHTML = '';
  if (!matches.length) {
    wrap.style.display = 'none';
    return;
  }
  matches.forEach(name => {
    const item = document.createElement('button');
    item.className = 'suggestion-item';
    item.type = 'button';
    item.textContent = name;
    item.addEventListener('click', () => selectPet(name));
    wrap.appendChild(item);
  });
  wrap.style.display = 'block';
}

function searchPets(query) {
  if (!query) return [];
  const queryChosung = getChosung(query);
  return Object.keys(petData)
    .filter(name => name.includes(query) || getChosung(name).includes(queryChosung))
    .sort((a, b) => a.localeCompare(b, 'ko-KR'));
}

function selectPet(name) {
  document.getElementById('pet-search').value = name;
  renderSuggestions([]);
  saveRecentSearch(name);
  fillIdealStats();
}

function calculateIdealStats(pet) {
  const baseAttack = pet.attackCoefficient + 2 + 2.5;
  const baseDefense = pet.defenseCoefficient + 2 + 2.5;
  const baseAgility = pet.agilityCoefficient + 2 + 2.5;
  const baseHealth = pet.healthCoefficient + 2 + 2.5;

  const initialAttack = (baseAttack * pet.initialCoefficient) / 100;
  const initialDefense = (baseDefense * pet.initialCoefficient) / 100;
  const initialAgility = (baseAgility * pet.initialCoefficient) / 100;
  const initialHealth = (baseHealth * pet.initialCoefficient) / 100;

  return {
    displayAttack: Math.floor(initialHealth * 0.1 + initialAttack + initialDefense * 0.1 + initialAgility * 0.05),
    displayDefense: Math.floor(initialHealth * 0.1 + initialAttack * 0.1 + initialDefense + initialAgility * 0.05),
    displayAgility: Math.floor(initialAgility),
    displayHealth: Math.floor(initialHealth * 4 + initialAttack + initialDefense + initialAgility)
  };
}

function updateDeviationCards(current, ideal) {
  document.getElementById('dist-attack').textContent = `${current.displayAttack - ideal.displayAttack >= 0 ? '+' : ''}${current.displayAttack - ideal.displayAttack}`;
  document.getElementById('dist-defense').textContent = `${current.displayDefense - ideal.displayDefense >= 0 ? '+' : ''}${current.displayDefense - ideal.displayDefense}`;
  document.getElementById('dist-agility').textContent = `${current.displayAgility - ideal.displayAgility >= 0 ? '+' : ''}${current.displayAgility - ideal.displayAgility}`;
  document.getElementById('dist-health').textContent = `${current.displayHealth - ideal.displayHealth >= 0 ? '+' : ''}${current.displayHealth - ideal.displayHealth}`;
}

function fillIdealStats() {
  const petName = document.getElementById('pet-search').value.trim();
  const pet = petData[petName];
  if (!pet) return;
  const ideal = calculateIdealStats(pet);
  document.getElementById('display-attack').value = ideal.displayAttack;
  document.getElementById('display-defense').value = ideal.displayDefense;
  document.getElementById('display-agility').value = ideal.displayAgility;
  document.getElementById('display-health').value = ideal.displayHealth;
  updateDeviationCards(ideal, ideal);
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map(v => v.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, idx) => {
      row[key] = (cols[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

async function fetchPublicCsvPets() {
  statusText('공개 CSV 시트에서 페트를 자동으로 불러오는 중...');
  const res = await fetch(window.PUBLIC_CSV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('CSV fetch failed: ' + res.status);
  const text = await res.text();
  const rows = parseCsv(text);

  const nextShared = {};
  rows.forEach(row => {
    const name = String(row.name || '').trim();
    if (!name) return;
    nextShared[name] = {
      initialCoefficient: Number(row.initialCoefficient) || 0,
      attackCoefficient: Number(row.attackCoefficient) || 0,
      defenseCoefficient: Number(row.defenseCoefficient) || 0,
      agilityCoefficient: Number(row.agilityCoefficient) || 0,
      healthCoefficient: Number(row.healthCoefficient) || 0
    };
  });

  petData = { ...defaultPetData, ...nextShared };
  renderPetList();
  renderSuggestions([]);
  statusText(`공개 CSV 페트 ${Object.keys(nextShared).length}종 자동 로드 완료`);
}

function formatPercentage(num) {
  if (num === 0) return '0.0%';
  let str = num.toFixed(20);
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) return str + '%';
  let firstNonZero = decimalIndex + 1;
  while (firstNonZero < str.length && str[firstNonZero] === '0') firstNonZero++;
  if (firstNonZero === str.length) return '0.0%';
  return str.slice(0, firstNonZero + 1) + '%';
}

function initPage() {
  renderRecentSearches();
  renderPetList();
  statusText('기본 페트 로드 완료 · 공개 CSV 자동 로딩 시작');
  fetchPublicCsvPets().catch((err) => {
    console.error(err);
    statusText('공개 CSV 자동 로딩 실패 · 기본 페트만 표시 중');
  });
}

document.getElementById('pet-search').addEventListener('input', (e) => {
  renderSuggestions(searchPets(e.target.value.trim()));
});

document.querySelectorAll('.mini-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const delta = parseInt(btn.dataset.delta, 10);
    const current = parseInt(target.value || '0', 10) || 0;
    target.value = current + delta;
  });
});

document.getElementById('fill-ideal-btn').addEventListener('click', fillIdealStats);

document.getElementById('calculate-btn').addEventListener('click', () => {
  const petName = document.getElementById('pet-search').value.trim();
  const displayAttack = parseInt(document.getElementById('display-attack').value) || NaN;
  const displayDefense = parseInt(document.getElementById('display-defense').value) || NaN;
  const displayAgility = parseInt(document.getElementById('display-agility').value) || NaN;
  const displayHealth = parseInt(document.getElementById('display-health').value) || NaN;

  if (!petName || !petData[petName] || isNaN(displayAttack) || isNaN(displayDefense) || isNaN(displayAgility) || isNaN(displayHealth)) {
    document.getElementById('result-box').innerHTML = '빈 칸이 있습니다!';
    return;
  }

  const pet = petData[petName];
  let totalCases = [];
  let hallucinationCases = 0;
  let exactMatchCount = 0;
  let totalPossibleCases = 0;

  for (let attackRandom = -2; attackRandom <= 2; attackRandom++) {
    for (let defenseRandom = -2; defenseRandom <= 2; defenseRandom++) {
      for (let agilityRandom = -2; agilityRandom <= 2; agilityRandom++) {
        for (let healthRandom = -2; healthRandom <= 2; healthRandom++) {
          for (let attackBonus = 0; attackBonus <= 10; attackBonus++) {
            for (let defenseBonus = 0; defenseBonus <= 10; defenseBonus++) {
              for (let agilityBonus = 0; agilityBonus <= 10; agilityBonus++) {
                const healthBonus = 10 - attackBonus - defenseBonus - agilityBonus;
                if (healthBonus < 0 || healthBonus > 10) continue;

                const baseAttack = pet.attackCoefficient + attackRandom + attackBonus;
                const baseDefense = pet.defenseCoefficient + defenseRandom + defenseBonus;
                const baseAgility = pet.agilityCoefficient + agilityRandom + agilityBonus;
                const baseHealth = pet.healthCoefficient + healthRandom + healthBonus;

                const initialAttack = (baseAttack * pet.initialCoefficient) / 100;
                const initialDefense = (baseDefense * pet.initialCoefficient) / 100;
                const initialAgility = (baseAgility * pet.initialCoefficient) / 100;
                const initialHealth = (baseHealth * pet.initialCoefficient) / 100;

                const calcAttack = Math.floor(initialHealth * 0.1 + initialAttack + initialDefense * 0.1 + initialAgility * 0.05);
                const calcDefense = Math.floor(initialHealth * 0.1 + initialAttack * 0.1 + initialDefense + initialAgility * 0.05);
                const calcAgility = Math.floor(initialAgility);
                const calcHealth = Math.floor(initialHealth * 4 + initialAttack + initialDefense + initialAgility);

                totalPossibleCases++;
                if (calcAttack === displayAttack && calcDefense === displayDefense && calcAgility === displayAgility && calcHealth === displayHealth) {
                  exactMatchCount++;
                  totalCases.push({ attackRandom, defenseRandom, agilityRandom, healthRandom });
                  if (attackRandom === 2 && defenseRandom === 2 && agilityRandom === 2 && healthRandom === 2) {
                    hallucinationCases++;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  saveRecentSearch(petName);

  const ideal = calculateIdealStats(pet);
  const current = { displayAttack, displayDefense, displayAgility, displayHealth };
  updateDeviationCards(current, ideal);

  if (!totalCases.length) {
    document.getElementById('kpi-success').textContent = '0%';
    document.getElementById('kpi-appear').textContent = '0%';
    document.getElementById('kpi-attempts').textContent = '불가';
    document.getElementById('result-box').innerHTML = '다른 값으로 시도해 주세요.';
    return;
  }

  let probability = ((hallucinationCases / totalCases.length) * 100);
  if (probability >= 100) probability = 99.99;
  probability = probability.toFixed(4);
  const exactPercentage = formatPercentage((exactMatchCount / totalPossibleCases) * 100);
  const averageAttempts = probability > 0 ? (1 / (probability / 100)).toFixed(2) : '불가능';

  document.getElementById('kpi-success').textContent = `${probability}%`;
  document.getElementById('kpi-appear').textContent = exactPercentage;
  document.getElementById('kpi-attempts').textContent = averageAttempts === '불가능' ? '불가' : `${averageAttempts}번`;

  document.getElementById('result-box').innerHTML = `
    <strong>${petName}</strong> 기준 계산 결과입니다.<br>
    성공 확률: <strong>${probability}%</strong><br>
    출현 확률: <strong>${exactPercentage}</strong><br>
    성공 기대값: <strong>${averageAttempts === '불가능' ? '최대 성장 불가능' : averageAttempts + '번'}</strong>
    ${hallucinationCases === 0 ? '<br><br>(최대 성장에 도달할 수 없어요)' : ''}
  `;
});

window.addEventListener('DOMContentLoaded', initPage);
