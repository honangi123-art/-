
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

function buildInitialStatsFromCoefficients(healthCoefficient, attackCoefficient, defenseCoefficient, agilityCoefficient, initialCoefficient) {
  const ratio = new Decimal(initialCoefficient).dividedBy(100);
  const health = new Decimal(healthCoefficient).plus(2.5).times(ratio);
  const attack = new Decimal(attackCoefficient).plus(2.5).times(ratio);
  const defense = new Decimal(defenseCoefficient).plus(2.5).times(ratio);
  const agility = new Decimal(agilityCoefficient).plus(2.5).times(ratio);

  return {
    health: health.times(4).plus(attack).plus(defense).plus(agility),
    attack: health.times(0.1).plus(attack).plus(defense.times(0.1)).plus(agility.times(0.05)),
    defense: health.times(0.1).plus(attack.times(0.1)).plus(defense).plus(agility.times(0.05)),
    agility
  };
}

function findBestInitialCoefficient(solution, hp1, st1, df1, de1) {
  const healthCoefficient = Math.round(Number(solution.a));
  const attackCoefficient = Math.round(Number(solution.b));
  const defenseCoefficient = Math.round(Number(solution.c));
  const agilityCoefficient = Math.round(Number(solution.d));

  if ([healthCoefficient, attackCoefficient, defenseCoefficient, agilityCoefficient].some(v => !Number.isFinite(v) || v < 0)) {
    return null;
  }

  const targets = {
    health: new Decimal(hp1),
    attack: new Decimal(st1),
    defense: new Decimal(df1),
    agility: new Decimal(de1)
  };

  let best = null;
  for (let initialCoefficient = 1; initialCoefficient <= 100; initialCoefficient++) {
    const predicted = buildInitialStatsFromCoefficients(
      healthCoefficient,
      attackCoefficient,
      defenseCoefficient,
      agilityCoefficient,
      initialCoefficient
    );

    const errors = {
      health: predicted.health.minus(targets.health).abs(),
      attack: predicted.attack.minus(targets.attack).abs(),
      defense: predicted.defense.minus(targets.defense).abs(),
      agility: predicted.agility.minus(targets.agility).abs()
    };

    // 네 초기치를 모두 사용한다. 큰 수치인 체력이 결과를 독점하지 않도록
    // 각 항목의 입력 크기로 나눈 상대 오차도 함께 비교한다.
    const absoluteError = errors.health.plus(errors.attack).plus(errors.defense).plus(errors.agility);
    const relativeError = errors.health.dividedBy(Decimal.max(targets.health.abs(), 1))
      .plus(errors.attack.dividedBy(Decimal.max(targets.attack.abs(), 1)))
      .plus(errors.defense.dividedBy(Decimal.max(targets.defense.abs(), 1)))
      .plus(errors.agility.dividedBy(Decimal.max(targets.agility.abs(), 1)));
    const score = relativeError.times(100).plus(absoluteError.times(0.01));

    if (!best || score.lessThan(best.score)) {
      best = { initialCoefficient, predicted, errors, absoluteError, relativeError, score };
    }
  }

  if (!best) return null;
  return {
    pet: {
      initialCoefficient: best.initialCoefficient,
      healthCoefficient,
      attackCoefficient,
      defenseCoefficient,
      agilityCoefficient
    },
    absoluteError: best.absoluteError,
    relativeError: best.relativeError,
    score: best.score
  };
}

function addPetFromSGrade(name, hp1, hp2, st1, st2, df1, df2, de1, de2) {
  const eValues = [575, 555, 535, 515, 495, 475];
  const solutions = [];

  for (const e of eValues) {
    try {
      const solution = solveEquations(hp2, st2, df2, de2, e);
      solutions.push(solution);
    } catch (_) {}
  }

  if (!solutions.length) return { ok: false, message: '적합한 계수를 찾을 수 없습니다!' };

  // 기존 등록 방식은 그대로 우선 적용한다. 따라서 예전에 정상 등록되던 페트의
  // 결과는 바뀌지 않고, 기존 방식이 실패할 때만 아래 보완 계산을 사용한다.
  const growthBest = solutions.reduce((best, solution) => {
    if (!best) return solution;
    return new Decimal(solution.totalDiff).lessThan(new Decimal(best.totalDiff)) ? solution : best;
  }, null);

  const hp1Decimal = new Decimal(hp1);
  const a = new Decimal(growthBest.a);
  const b = new Decimal(growthBest.b);
  const c = new Decimal(growthBest.c);
  const d = new Decimal(growthBest.d);
  const aPlus25 = a.plus(2.5);
  const bPlus25 = b.plus(2.5);
  const cPlus25 = c.plus(2.5);
  const dPlus25 = d.plus(2.5);

  for (let i = 1; i < 100; i++) {
    const iDecimal = new Decimal(i).dividedBy(100);
    const a5 = aPlus25.times(iDecimal);
    const b5 = bPlus25.times(iDecimal);
    const c5 = cPlus25.times(iDecimal);
    const d5 = dPlus25.times(iDecimal);
    const finalHealth = a5.times(4).plus(b5).plus(c5).plus(d5);

    if (finalHealth.floor().equals(hp1Decimal.floor())) {
      const finalAttack = a5.times(0.1).plus(b5).plus(c5.times(0.1)).plus(d5.times(0.05));
      const finalDefense = a5.times(0.1).plus(b5.times(0.1)).plus(c5).plus(d5.times(0.05));
      const legacyResult = addPetFromFinalStats(
        name,
        finalHealth.toNumber(),
        finalAttack.toNumber(),
        finalDefense.toNumber(),
        d5.toNumber()
      );
      if (legacyResult.ok) return legacyResult;
      break;
    }
  }

  // 보완 경로: 성장률 공식은 그대로 두고, 모든 성장률 후보에 대해
  // 공/방/순/체 초기치 네 개와 가장 잘 맞는 정수 IC를 직접 찾는다.
  let bestFallback = null;
  for (const solution of solutions) {
    const initialFit = findBestInitialCoefficient(solution, hp1, st1, df1, de1);
    if (!initialFit) continue;

    // 성장률 재현 오차와 초기치 재현 오차를 함께 보아 잘못된 후보 선택을 막는다.
    const combinedScore = initialFit.score.plus(new Decimal(solution.totalDiff).times(10));
    if (!bestFallback || combinedScore.lessThan(bestFallback.combinedScore)) {
      bestFallback = { solution, initialFit, combinedScore };
    }
  }

  if (!bestFallback) return { ok: false, message: '입력값에 맞는 계수를 찾을 수 없습니다!' };

  // 소수 둘째 자리 입력의 반올림 오차는 허용하되, 전혀 다른 값이 들어온 경우는 막는다.
  // 상대 오차 합 8% 초과 또는 절대 오차 합 2.0 초과일 때만 입력 재확인을 요청한다.
  if (bestFallback.initialFit.relativeError.greaterThan(0.08) || bestFallback.initialFit.absoluteError.greaterThan(2)) {
    return { ok: false, message: '초기치와 성장률의 차이가 너무 큽니다. 입력값을 다시 확인해 주세요!' };
  }

  return {
    ok: true,
    tolerance: 'fallback',
    pet: bestFallback.initialFit.pet
  };
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
