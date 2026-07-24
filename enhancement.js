'use strict';

const EQUIPMENT_RATES = [0.50,0.40,0.35,0.30,0.30,0.25,0.20,0.15,0.12,0.09];
const EQUIPMENT_KEEP = new Set([0,1,4,7]);
const TOTEM_RATES = [1.00,0.80,0.60,0.50,0.50,0.40,0.30,0.20,0.20,0.10];
const TOTEM_KEEP = new Set([0,1,2,3,4]);

const ITEM_DATA = {
  weapon:{label:'무기',stats:[{}, {공격:1,특공:5},{공격:2,크리:2,특공:5},{공격:3,명중:1,크리:2,특공:5},{공격:4,명중:1,크리:2,특공:10},{공격:5,명중:1,크리:4,특공:10},{공격:6,명중:2,크리:4,특공:10},{공격:7,명중:2,크리:5,특공:15},{공격:9,명중:3,크리:5,특공:18},{공격:11,명중:4,크리:5,특공:21},{공격:13,명중:5,크리:5,특공:25}]},
  armor:{label:'갑옷',stats:[{}, {방어:1,특방:3},{방어:2,특방:3},{방어:3,특방:3},{방어:4,특방:6},{방어:5,특방:6},{방어:6,특방:6},{방어:7,특방:9},{방어:9,특방:11},{방어:11,특방:13},{방어:13,특방:15}]},
  helmet:{label:'투구',stats:[{}, {내구:3},{내구:6},{내구:9},{내구:19},{내구:22},{내구:25},{내구:35},{내구:40},{내구:48},{내구:60}]},
  totem:{label:'토템',stats:[{}, {내구:2},{내구:4},{내구:6,특공:1},{내구:8,특공:2},{내구:10,특공:3},{내구:17,특공:5},{내구:22,특공:7},{내구:30,특공:9},{내구:35,특공:12},{내구:45,특공:15}]}
};

const ids=['itemType','spiritTypeField','spiritType','startLevel','targetLevel','stonePrice','resourcePriceLabel','resourceBadgeText','usedResourceLabel','avgResourceLabel','resetBtn','currentLevelText','levelProgress','currentOptions','enhanceOnceBtn','autoEnhanceBtn','lastResult','usedStones','successCount','failureCount','destroyedCount','totalCost','nextAttemptLabel','nextProbability','failureOutcome','simulationRuns','runSimulationBtn','avgAttempts','medianAttempts','p90Attempts','p95Attempts','minAttempts','maxAttempts','avgDestroyed','simulationNote','historyList','clearHistoryBtn','levelTableBody','tableLegend'];
const els=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
let state={currentLevel:0,usedStones:0,successes:0,failures:0,destroyed:0,history:[],destroyedCurrent:false};

const isTotem=()=>els.itemType.value==='totem';
function resourceName(){return isTotem()?(els.spiritType.value==='advanced'?'고급 영석':'일반 영석'):'강화석';}
function rateAt(level){const base=isTotem()?TOTEM_RATES[level]:EQUIPMENT_RATES[level];return isTotem()&&els.spiritType.value==='advanced'?Math.min(1,base+0.20):base;}
function failResult(level){
  if(isTotem()) return TOTEM_KEEP.has(level)?{kind:'keep',level}:{kind:'destroy',level:0};
  return EQUIPMENT_KEEP.has(level)?{kind:'keep',level}:{kind:'down',level:Math.max(0,level-1)};
}
function formatNumber(v){return new Intl.NumberFormat('ko-KR').format(Math.round(v));}
function fillLevelSelectors(){els.startLevel.innerHTML='';for(let i=0;i<=9;i++)els.startLevel.add(new Option(`+${i}`,String(i)));refreshTargetOptions();}
function refreshTargetOptions(){const start=Number(els.startLevel.value||0),prev=Number(els.targetLevel.value||10);els.targetLevel.innerHTML='';for(let i=start+1;i<=10;i++)els.targetLevel.add(new Option(`+${i}`,String(i)));els.targetLevel.value=String(Math.max(start+1,Math.min(10,prev)));}
function entries(type,level){return Object.entries(ITEM_DATA[type].stats[level]||{});}
function renderOptionChips(container,type,level){const e=entries(type,level);container.innerHTML=e.length?e.map(([k,v])=>`<span class="option-chip">${k} +${v}</span>`).join(''):'<span class="option-chip">추가 옵션 없음</span>';}
function addHistory(from,to,result){state.history.unshift({from,to,result,index:state.usedStones});state.history=state.history.slice(0,40);}

function updateModeUI(){
  const t=isTotem(),r=resourceName();
  els.spiritTypeField.classList.toggle('is-hidden',!t);
  els.resourcePriceLabel.textContent=`${r} 개당 가격`;
  els.resourceBadgeText.textContent=`1회 = ${t?'영석':'강화석'} 1개`;
  els.usedResourceLabel.textContent=`사용 ${r}`;
  els.avgResourceLabel.textContent=`평균 ${r}`;
  els.tableLegend.innerHTML=t?'<span class="save-dot"></span> 1~5강 실패 유지 · 6강부터 실패 시 파괴':'<span class="save-dot"></span> 세이브 구간';
}
function updateSessionUI(){
  updateModeUI();
  const level=state.currentLevel,target=Number(els.targetLevel.value),type=els.itemType.value,price=Math.max(0,Number(els.stonePrice.value)||0);
  els.currentLevelText.textContent=state.destroyedCurrent?'파괴':`+${level}`;
  els.levelProgress.style.width=`${state.destroyedCurrent?0:level*10}%`;
  renderOptionChips(els.currentOptions,type,state.destroyedCurrent?0:level);
  els.usedStones.textContent=formatNumber(state.usedStones);els.successCount.textContent=formatNumber(state.successes);els.failureCount.textContent=formatNumber(state.failures);els.destroyedCount.textContent=formatNumber(state.destroyed);els.totalCost.textContent=`${formatNumber(state.usedStones*price)} 스톤`;
  const completed=level>=target||level>=10||state.destroyedCurrent;els.enhanceOnceBtn.disabled=completed;els.autoEnhanceBtn.disabled=level>=target||level>=10;
  if(state.destroyedCurrent){els.nextAttemptLabel.textContent='토템 파괴';els.nextProbability.textContent='-';els.failureOutcome.textContent='초기화 후 재도전';}
  else if(level>=10){els.nextAttemptLabel.textContent='최대 강화';els.nextProbability.textContent='-';els.failureOutcome.textContent='-';}
  else{const f=failResult(level);els.nextAttemptLabel.textContent=`${level} → ${level+1}`;els.nextProbability.textContent=`${Math.round(rateAt(level)*100)}%`;els.failureOutcome.textContent=f.kind==='keep'?'유지':f.kind==='destroy'?'파괴':`+${f.level}로 하락`;}
  renderHistory();
}
function attemptEnhancement({render=true,autoReplace=false}={}){
  const target=Number(els.targetLevel.value);if(state.currentLevel>=target||state.currentLevel>=10||state.destroyedCurrent)return null;
  const from=state.currentLevel,success=Math.random()<rateAt(from);state.usedStones++;
  let result='success';
  if(success){state.currentLevel++;state.successes++;}
  else{state.failures++;const f=failResult(from);result=f.kind;if(f.kind==='destroy'){state.destroyed++;state.currentLevel=0;state.destroyedCurrent=!autoReplace;}else state.currentLevel=f.level;}
  addHistory(from,state.currentLevel,result);
  if(render){els.lastResult.className=`result-banner ${success?'success':'failure'}`;els.lastResult.textContent=success?`성공! +${from}에서 +${state.currentLevel}(으)로 올랐습니다.`:result==='keep'?`실패했지만 +${from}을 유지했습니다.`:result==='destroy'?`강화 실패로 토템이 파괴되었습니다.`:`실패하여 +${from}에서 +${state.currentLevel}(으)로 내려갔습니다.`;updateSessionUI();}
  return result;
}
function autoEnhance(){const target=Number(els.targetLevel.value),before=state.usedStones,beforeDestroyed=state.destroyed;state.destroyedCurrent=false;let guard=0;while(state.currentLevel<target&&guard<1000000){attemptEnhancement({render:false,autoReplace:true});guard++;}const spent=state.usedStones-before,d=state.destroyed-beforeDestroyed;els.lastResult.className='result-banner success';els.lastResult.textContent=`목표 +${target} 달성! ${resourceName()} ${formatNumber(spent)}개 사용${isTotem()?`, 토템 ${formatNumber(d)}개 파괴`:''}.`;updateSessionUI();}
function resetSession(){state={currentLevel:Number(els.startLevel.value),usedStones:0,successes:0,failures:0,destroyed:0,history:[],destroyedCurrent:false};els.lastResult.className='result-banner neutral';els.lastResult.textContent='강화 버튼을 눌러 시작하세요.';updateSessionUI();}
function renderHistory(){if(!state.history.length){els.historyList.innerHTML='<li class="empty-history">아직 강화 기록이 없습니다.</li>';return;}els.historyList.innerHTML=state.history.map(e=>{const txt=e.result==='success'?`+${e.from} → +${e.to}`:e.result==='keep'?`+${e.from} 유지`:e.result==='destroy'?`+${e.from} → 파괴`:`+${e.from} → +${e.to}`;const ok=e.result==='success';return `<li><span class="history-index">#${e.index}</span><span>${txt}</span><span class="history-result ${ok?'success':'failure'}">${ok?'성공':e.result==='destroy'?'파괴':'실패'}</span></li>`;}).join('');}
function renderLevelTable(){const type=els.itemType.value;els.levelTableBody.innerHTML=Array.from({length:10},(_,current)=>{const next=current+1,f=failResult(current),optionHtml=entries(type,next).map(([k,v])=>`<span>${k} +${v}</span>`).join(''),save=f.kind==='keep';return `<tr class="${save?'save-row':''}"><td>+${next}${save?' · 유지':''}</td><td>${Math.round(rateAt(current)*100)}%</td><td class="${f.kind==='keep'?'badge-keep':'badge-down'}">${f.kind==='keep'?`+${current} 유지`:f.kind==='destroy'?'파괴':`+${f.level}로 하락`}</td><td><div class="option-text">${optionHtml||'<span>옵션 없음</span>'}</div></td></tr>`;}).join('');}
function simulateOne(start,target){let level=start,attempts=0,destroyed=0;while(level<target&&attempts<1000000){if(Math.random()<rateAt(level))level++;else{const f=failResult(level);if(f.kind==='destroy'){destroyed++;level=0;}else level=f.level;}attempts++;}return {attempts,destroyed};}
function percentile(sorted,p){return sorted[Math.max(0,Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1))];}
function runSimulation(){const runs=Number(els.simulationRuns.value),start=Number(els.startLevel.value),target=Number(els.targetLevel.value),price=Math.max(0,Number(els.stonePrice.value)||0);els.runSimulationBtn.disabled=true;els.runSimulationBtn.textContent='계산 중…';setTimeout(()=>{const arr=[],dest=[];let total=0,totalD=0;for(let i=0;i<runs;i++){const r=simulateOne(start,target);arr.push(r.attempts);dest.push(r.destroyed);total+=r.attempts;totalD+=r.destroyed;}arr.sort((a,b)=>a-b);const avg=total/runs;els.avgAttempts.textContent=formatNumber(avg);els.medianAttempts.textContent=formatNumber(percentile(arr,.5));els.p90Attempts.textContent=formatNumber(percentile(arr,.9));els.p95Attempts.textContent=formatNumber(percentile(arr,.95));els.minAttempts.textContent=formatNumber(arr[0]);els.maxAttempts.textContent=formatNumber(arr[arr.length-1]);els.avgDestroyed.textContent=isTotem()?`${(totalD/runs).toFixed(2)}개`:'-';const cost=price>0?` 평균 비용 약 ${formatNumber(avg*price)}스톤.`:'';els.simulationNote.textContent=`${formatNumber(runs)}번 실험 기준, +${start}에서 +${target}까지 평균 ${resourceName()} ${formatNumber(avg)}개가 필요했습니다.${isTotem()?` 평균 파괴 토템은 ${(totalD/runs).toFixed(2)}개입니다.`:''}${cost}`;els.runSimulationBtn.disabled=false;els.runSimulationBtn.textContent='통계 실행';},30);}

els.itemType.addEventListener('change',()=>{updateModeUI();renderLevelTable();resetSession();});els.spiritType.addEventListener('change',()=>{renderLevelTable();updateSessionUI();});els.startLevel.addEventListener('change',()=>{refreshTargetOptions();resetSession();});els.targetLevel.addEventListener('change',updateSessionUI);els.stonePrice.addEventListener('input',updateSessionUI);els.enhanceOnceBtn.addEventListener('click',()=>attemptEnhancement());els.autoEnhanceBtn.addEventListener('click',autoEnhance);els.resetBtn.addEventListener('click',resetSession);els.clearHistoryBtn.addEventListener('click',()=>{state.history=[];renderHistory();});els.runSimulationBtn.addEventListener('click',runSimulation);
fillLevelSelectors();updateModeUI();renderLevelTable();resetSession();
