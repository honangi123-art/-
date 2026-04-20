
const RECENT_KEY = 'stoneAgeRecentSearches';

const defaultPetData = {
  "짜얄(kiketiti)": { initialCoefficient: 17, healthCoefficient: 25, attackCoefficient: 24, defenseCoefficient: 9, agilityCoefficient: 34 },
  "유미(lunya0519)": { initialCoefficient: 24, healthCoefficient: 36, attackCoefficient: 20, defenseCoefficient: 36, agilityCoefficient: 15 }
};

let petData = { ...defaultPetData };

function statusText(text){ document.getElementById('load-status').textContent = text; }
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

function solveEquations(hp2, st2, df2, de2, e) {
  if (typeof Decimal === 'undefined') throw new Error('decimal.js 로드 실패');

  Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

  const eDecimal = new Decimal(e);
  const hp2Decimal = new Decimal(hp2);
  const st2Decimal = new Decimal(st2);
  const df2Decimal = new Decimal(df2);
  const de2Decimal = new Decimal(de2);
  const factor = eDecimal.dividedBy(10000);

  const d = de2Decimal.times(10000).dividedBy(eDecimal).minus(2.5);
  const A = [
    [factor.times(4), factor, factor],
    [factor.times(0.1), factor, factor.times(0.1)],
    [factor.times(0.1), factor.times(0.1), factor]
  ];

  const dPlus25 = d.plus(2.5);
  const dTerm = dPlus25.times(factor);
  const B = [
    hp2Decimal.minus(dTerm),
    st2Decimal.minus(dTerm.times(0.05)),
    df2Decimal.minus(dTerm.times(0.05))
  ];

  const augMatrix = [
    [A[0][0], A[0][1], A[0][2], B[0]],
    [A[1][0], A[1][1], A[1][2], B[1]],
    [A[2][0], A[2][1], A[2][2], B[2]]
  ];

  for (let i = 0; i < 3; i++) {
    let maxRowIndex = i;
    let maxVal = augMatrix[i][i].abs();
    for (let j = i + 1; j < 3; j++) {
      if (augMatrix[j][i].abs().greaterThan(maxVal)) {
        maxRowIndex = j;
        maxVal = augMatrix[j][i].abs();
      }
    }
    if (maxRowIndex !== i) [augMatrix[i], augMatrix[maxRowIndex]] = [augMatrix[maxRowIndex], augMatrix[i]];

    const pivot = augMatrix[i][i];
    for (let j = i; j < 4; j++) augMatrix[i][j] = augMatrix[i][j].dividedBy(pivot);

    for (let k = 0; k < 3; k++) {
      if (k !== i) {
        const factor2 = augMatrix[k][i];
        for (let j = i; j < 4; j++) {
          augMatrix[k][j] = augMatrix[k][j].minus(factor2.times(augMatrix[i][j]));
        }
      }
    }
  }

  const a = augMatrix[0][3].minus(2.5).round();
  const b = augMatrix[1][3].minus(2.5).round();
  const c = augMatrix[2][3].minus(2.5).round();

  const aPlus25Full = a.plus(2.5);
  const bPlus25Full = b.plus(2.5);
  const cPlus25Full = c.plus(2.5);
  const dPlus25Full = d.plus(2.5);

  const test1 = aPlus25Full.times(factor).times(4).plus(bPlus25Full.times(factor)).plus(cPlus25Full.times(factor)).plus(dPlus25Full.times(factor));
  const test2 = aPlus25Full.times(factor).times(0.1).plus(bPlus25Full.times(factor)).plus(cPlus25Full.times(factor).times(0.1)).plus(dPlus25Full.times(factor).times(0.05));
  const test3 = aPlus25Full.times(factor).times(0.1).plus(bPlus25Full.times(factor).times(0.1)).plus(cPlus25Full.times(factor)).plus(dPlus25Full.times(factor).times(0.05));
  const test4 = dPlus25Full.times(factor);

  const diff1 = test1.toDecimalPlaces(2).minus(hp2Decimal).abs();
  const diff2 = test2.toDecimalPlaces(2).minus(st2Decimal).abs();
  const diff3 = test3.toDecimalPlaces(2).minus(df2Decimal).abs();
  const diff4 = test4.toDecimalPlaces(2).minus(de2Decimal).abs();
  const totalDiff = diff1.plus(diff2).plus(diff3).plus(diff4);

  return {
    a: a.toString(),
    b: b.toString(),
    c: c.toString(),
    d: d.toString(),
    totalDiff: totalDiff.toString(),
    e
  };
}

function addPetFromFinalStats(name, finalHealth, finalAttack, finalDefense, finalAgility) {
  function tryCalculateCoefficients(tolerance) {
    for (let initialStatCoefficient = 10; initialStatCoefficient <= 100; initialStatCoefficient++) {
      const agilityCoefficient = (finalAgility * 100 / initialStatCoefficient) - 4.5;
      if (agilityCoefficient <= 0 || Math.abs(agilityCoefficient - Math.round(agilityCoefficient)) > tolerance) continue;

      const roundedAgilityCoeff = Math.round(agilityCoefficient);
      const eq1_rhs = finalHealth - finalAgility;
      const eq2_rhs = finalAttack - (0.05 * finalAgility);
      const eq3_rhs = finalDefense - (0.05 * finalAgility);

      const eq4_rhs = eq2_rhs - eq1_rhs;
      const eq5_rhs = eq3_rhs - 0.1 * eq1_rhs;

      const eq5 = { A: -3, C: 9, RHS: eq5_rhs * 10 };
      const eq4 = { A: -3.9, C: -0.9, RHS: eq4_rhs };
      const multiplier = 3 / 3.9;
      const eq4_scaled = { A: eq4.A * multiplier, C: eq4.C * multiplier, RHS: eq4.RHS * multiplier };
      const C_coeff = 9.6923;
      const C_rhs = eq5.RHS - eq4_scaled.RHS;

      const C = C_rhs / C_coeff;
      const A = (eq5_rhs - 0.9 * C) / -0.3;
      const B = eq1_rhs - 4 * A - C;

      if (A < 0 || B < 0 || C < 0) continue;

      const healthCoefficient = (A * 100 / initialStatCoefficient) - 4.5;
      const attackCoefficient = (B * 100 / initialStatCoefficient) - 4.5;
      const defenseCoefficient = (C * 100 / initialStatCoefficient) - 4.5;

      if (
        Math.abs(healthCoefficient - Math.round(healthCoefficient)) > tolerance ||
        Math.abs(attackCoefficient - Math.round(attackCoefficient)) > tolerance ||
        Math.abs(defenseCoefficient - Math.round(defenseCoefficient)) > tolerance
      ) continue;

      return {
        ok: true,
        tolerance,
        pet: {
          initialCoefficient: initialStatCoefficient,
          healthCoefficient: Math.round(healthCoefficient),
          attackCoefficient: Math.round(attackCoefficient),
          defenseCoefficient: Math.round(defenseCoefficient),
          agilityCoefficient: roundedAgilityCoeff
        }
      };
    }
    return { ok: false };
  }

  let result = tryCalculateCoefficients(0.1);
  if (!result.ok) result = tryCalculateCoefficients(0.2);
  return result;
}

function addPetFromSGrade(name, hp1, hp2, st1, st2, df1, df2, de1, de2) {
  const eValues = [575, 555, 535, 515, 495, 475];
  let bestSolution = null;
  let minDiff = new Decimal(Number.MAX_VALUE);

  for (const e of eValues) {
    try {
      const solution = solveEquations(hp2, st2, df2, de2, e);
      const totalDiff = new Decimal(solution.totalDiff);
      if (totalDiff.lessThan(minDiff)) {
        minDiff = totalDiff;
        bestSolution = solution;
      }
    } catch (_) {}
  }

  if (!bestSolution) return { ok: false, message: '적합한 계수를 찾을 수 없습니다!' };

  const hp1Decimal = new Decimal(hp1);
  const a = new Decimal(bestSolution.a);
  const b = new Decimal(bestSolution.b);
  const c = new Decimal(bestSolution.c);
  const d = new Decimal(bestSolution.d);

  const aPlus25 = a.plus(2.5);
  const bPlus25 = b.plus(2.5);
  const cPlus25 = c.plus(2.5);
  const dPlus25 = d.plus(2.5);

  let finalHealth, finalAttack, finalDefense, finalAgility;
  let foundInitialValues = false;

  for (let i = 1; i < 100; i++) {
    const iDecimal = new Decimal(i).dividedBy(100);
    const a5 = aPlus25.times(iDecimal);
    const b5 = bPlus25.times(iDecimal);
    const c5 = cPlus25.times(iDecimal);
    const d5 = dPlus25.times(iDecimal);

    const a6 = a5.times(4).plus(b5).plus(c5).plus(d5);
    const b6 = a5.times(0.1).plus(b5).plus(c5.times(0.1)).plus(d5.times(0.05));
    const c6 = a5.times(0.1).plus(b5.times(0.1)).plus(c5).plus(d5.times(0.05));
    const d6 = d5;

    if (a6.floor().equals(hp1Decimal.floor())) {
      finalHealth = a6;
      finalAttack = b6;
      finalDefense = c6;
      finalAgility = d6;
      foundInitialValues = true;
      break;
    }
  }

  if (!foundInitialValues) return { ok: false, message: '초기치 소숫점 계산에 실패했습니다!' };
  const result = addPetFromFinalStats(name, finalHealth.toNumber(), finalAttack.toNumber(), finalDefense.toNumber(), finalAgility.toNumber());
  if (!result.ok) return result;
  return result;
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

  if (!name || [atk, def, agi, hp, gatk, gdef, gagi, ghp].some(v => Number.isNaN(v))) {
    addStatus('모든 입력칸을 채워주세요.');
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
