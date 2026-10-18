
const RECENT_KEY = 'stoneAgeRecentSearches';

const defaultPetData = {
  "짜얄(kiketiti)": { initialCoefficient: 17, healthCoefficient: 25, attackCoefficient: 24, defenseCoefficient: 9, agilityCoefficient: 34 },
  "유미(lunya0519)": { initialCoefficient: 24, healthCoefficient: 36, attackCoefficient: 20, defenseCoefficient: 36, agilityCoefficient: 15 }
};

let petData = { ...defaultPetData };

function statusText(text){ const el = document.getElementById('load-status'); if (el) el.textContent = text; }
function addStatus(text){ document.getElementById('add-status').textContent = text; }

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
  if (!list) return;
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
    header.forEach((key, idx) => row[key] = (cols[idx] || '').trim());
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

async function fireGetRequest(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve(true);
    };
    img.onload = done;
    img.onerror = done;
    setTimeout(done, 1500);
    img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  });
}

// The game truncates initial stats to 2 places and growth to 3 places.
// Work with their displayed intervals rather than comparing HP integers.
function petDisplayMatches(actual, displayed, places) {
  const scale = 10 ** places;
  return Math.floor(actual * scale + 1e-7) === Math.round(displayed * scale);
}

function petStatsFromBases([h, a, d, g]) {
  return [4 * h + a + d + g, 0.1 * h + a + 0.1 * d + 0.05 * g,
    0.1 * h + 0.1 * a + d + 0.05 * g, g];
}

function petBasesFromStats([hp, attack, defense, agility]) {
  const h = (1.1 * hp - attack - defense - agility) / 4.2;
  const sum = (attack + defense - 0.2 * h - 0.1 * agility) / 1.1;
  const difference = (attack - defense) / 0.9;
  return [h, (sum + difference) / 2, (sum - difference) / 2, agility];
}

function addPetFromSGrade(name, hp1, hp2, st1, st2, df1, df2, de1, de2) {
  const initial = [hp1, st1, df1, de1];
  const growth = [hp2, st2, df2, de2];
  if ([...initial, ...growth].some(value => !Number.isFinite(value) || value <= 0)) {
    return { ok: false, message: '초기치와 성장률은 0보다 큰 숫자로 입력해 주세요.' };
  }
  if (initial.some(value => !Number.isSafeInteger(Math.round(value * 100)) || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)
      || growth.some(value => !Number.isSafeInteger(Math.round(value * 1000)) || Math.abs(value * 1000 - Math.round(value * 1000)) > 1e-7)) {
    return { ok: false, message: '게임에 표시된 초기치(소수점 2자리), 성장률(소수점 3자리)을 입력해 주세요.' };
  }

  // A linear inverse reaches its bounds at corners of the display intervals.
  const bounds = Array.from({ length: 4 }, () => [Infinity, -Infinity]);
  for (let mask = 0; mask < 16; mask++) {
    const corner = initial.map((value, index) => value + ((mask >> index) & 1) * 0.01);
    petBasesFromStats(corner).forEach((value, index) => {
      bounds[index][0] = Math.min(bounds[index][0], value);
      bounds[index][1] = Math.max(bounds[index][1], value);
    });
  }

  const candidates = [];
  for (let ic = 1; ic <= 100; ic++) {
    // S-grade bases are sheet coefficient + 2 + 2.5, hence half integers.
    const options = bounds.map(([low, high]) => {
      const values = [];
      const first = Math.max(1, Math.ceil(low * 100 / ic - 4.5 - 1e-7));
      const last = Math.floor(high * 100 / ic - 4.5 + 1e-7);
      for (let coefficient = first; coefficient <= last; coefficient++) values.push(coefficient + 4.5);
      return values;
    });
    for (const h of options[0]) for (const a of options[1]) {
      for (const d of options[2]) for (const g of options[3]) {
        const baseStats = petStatsFromBases([h, a, d, g]);
        if (!baseStats.every((value, index) => petDisplayMatches(value * ic / 100, initial[index], 2))) continue;

        // Infer the growth multiplier instead of forcing e=475 for every pet.
        let lower = 0;
        let upper = Infinity;
        baseStats.forEach((value, index) => {
          lower = Math.max(lower, growth[index] / value);
          upper = Math.min(upper, (growth[index] + 0.001) / value);
        });
        if (lower >= upper) continue;
        // Retain the existing e/10000 convention, allowing any positive integer e.
        const firstE = Math.max(1, Math.ceil(lower * 10000 - 1e-7));
        const lastE = Math.ceil(upper * 10000 - 1e-7) - 1;
        if (!Number.isSafeInteger(firstE) || !Number.isSafeInteger(lastE)) continue;
        const growthMultipliers = [];
        for (let e = firstE; e <= lastE; e++) {
          if (baseStats.every((value, index) => petDisplayMatches(value * e / 10000, growth[index], 3))) {
            growthMultipliers.push(e);
          }
        }
        if (!growthMultipliers.length) continue;
        candidates.push({
          pet: { initialCoefficient: ic, healthCoefficient: h - 4.5,
            attackCoefficient: a - 4.5, defenseCoefficient: d - 4.5, agilityCoefficient: g - 4.5 },
          growthMultipliers
        });
      }
    }
  }

  // Keep the original 475 convention only when all eight input stats agree.
  const legacy = candidates.filter(candidate => candidate.growthMultipliers.includes(475));
  const matches = legacy.length === 1 ? legacy : candidates;
  if (!matches.length) {
    return { ok: false, message: '초기치와 성장률 8개를 모두 만족하는 계수가 없습니다. S급 이상치인지, 입력값이 같은 페트의 수치인지 확인해 주세요.' };
  }
  if (matches.length !== 1) {
    return { ok: false, message: `계수 후보가 ${matches.length}개라 확정할 수 없습니다. 잘못된 등록을 막기 위해 저장하지 않았습니다. S급 이상치를 확인해 주세요.` };
  }
  return { ok: true, pet: matches[0].pet, growthMultipliers: matches[0].growthMultipliers };
}

async function savePetToAppsScript(name, pet) {
  const url = new URL(window.APPS_SCRIPT_URL);
  url.searchParams.set('mode', 'add');
  url.searchParams.set('name', name);
  url.searchParams.set('initialCoefficient', pet.initialCoefficient);
  url.searchParams.set('attackCoefficient', pet.attackCoefficient);
  url.searchParams.set('defenseCoefficient', pet.defenseCoefficient);
  url.searchParams.set('agilityCoefficient', pet.agilityCoefficient);
  url.searchParams.set('healthCoefficient', pet.healthCoefficient);

  await fireGetRequest(url.toString());
}

async function handleAddPet() {
  const name = document.getElementById('add-name').value.trim();
  const atk = parseFloat(document.getElementById('add-atk').value);
  const def = parseFloat(document.getElementById('add-def').value);
  const agi = parseFloat(document.getElementById('add-agi').value);
  const hp = parseFloat(document.getElementById('add-hp').value);
  const gatk = parseFloat(document.getElementById('grow-atk').value);
  const gdef = parseFloat(document.getElementById('grow-def').value);
  const gagi = parseFloat(document.getElementById('grow-agi').value);
  const ghp = parseFloat(document.getElementById('grow-hp').value);

  if (!name || [atk, def, agi, hp, gatk, gdef, gagi, ghp].some(v => !Number.isFinite(v) || v <= 0)) {
    addStatus('이름과 모든 수치를 입력해 주세요. 수치는 0보다 커야 합니다.');
    return;
  }

  if (petData[name]) {
    addStatus('이미 존재하는 이름입니다.');
    return;
  }

  addStatus('계수 변환 중...');

  let result;
  try {
    result = addPetFromSGrade(name, hp, ghp, atk, gatk, def, gdef, agi, gagi);
  } catch (error) {
    console.error(error);
    addStatus('계산 중 오류가 발생했습니다.');
    return;
  }

  if (!result.ok || !result.pet) {
    addStatus(result.message || '계수 변환에 실패했습니다.');
    return;
  }

  addStatus(`변환 완료 · IC ${result.pet.initialCoefficient}, 공 ${result.pet.attackCoefficient}, 방 ${result.pet.defenseCoefficient}, 순 ${result.pet.agilityCoefficient}, 체 ${result.pet.healthCoefficient} 저장 중...`);

  try {
    await savePetToAppsScript(name, result.pet);
    await new Promise(r => setTimeout(r, 1500));
    await fetchPublicCsvPets();
    addStatus('공유 시트에 저장 완료되었습니다.');

    document.getElementById('add-name').value = '';
    document.getElementById('add-atk').value = '';
    document.getElementById('add-def').value = '';
    document.getElementById('add-agi').value = '';
    document.getElementById('add-hp').value = '';
    document.getElementById('grow-atk').value = '';
    document.getElementById('grow-def').value = '';
    document.getElementById('grow-agi').value = '';
    document.getElementById('grow-hp').value = '';
  } catch (error) {
    console.error(error);
    addStatus('Apps Script 저장에 실패했습니다. 웹앱 공개 권한을 다시 확인해 주세요.');
  }
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
  addStatus('아직 추가 전입니다.');
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
document.getElementById('add-pet-btn').addEventListener('click', handleAddPet);

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
