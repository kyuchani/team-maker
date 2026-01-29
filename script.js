let currentMode = 'simple';
const teamCountInput = document.getElementById('teamCount');
const tierContainer = document.getElementById('tier-container');
const resultArea = document.getElementById('result-area');
const loadingArea = document.getElementById('loading-area');
const showAllBtn = document.getElementById('showAllBtn');
const teamsOutput = document.getElementById('teams-output');
const emptyResult = document.getElementById('empty-result');

// =========================
// 후원 설정 (여기만 채우면 됨)
// =========================
const DONATION_CONFIG = {
    providerName: "Ko-fi",
    // Ko-fi 아이디만 넣으면, $10/$20/$50 버튼이 자동으로 동작합니다.
    // 예: ko-fi.com/myname 이면 kofiId: "myname"
    kofiId: "xhani",

    // (고급) 다른 플랫폼이거나 템플릿이 확실할 때만 사용
    // 예: "https://ko-fi.com/{id}?amount={amount}" 처럼 쓰고 싶으면 아래처럼 직접 지정 가능
    // - urlTemplate 안에서 {amount}는 자동 치환됩니다.
    // - (선택) {id}도 같이 쓰면 kofiId로 치환됩니다.
    urlTemplate: "",

    // 템플릿이 불가능하면 baseUrl만 넣어도 됩니다 (금액 버튼도 같은 페이지로 이동)
    baseUrl: "",

    // 버튼 금액 (B 방식)
    amounts: [10, 20, 50],

    // (선택) 계좌도 같이 열어두고 싶으면 입력. 비우면 모달에서 자동 숨김.
    bankText: "", // 예: "국민 123-456-789012 예금주 홍길동"
};

window.onload = () => {
    addTierGroup("그룹 1 (예: 팀장, S티어)"); 
    addTierGroup("그룹 2 (예: 팀원, A티어)"); 
};

window.switchMode = (mode) => {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('mode-simple').classList.toggle('hidden', mode !== 'simple');
    document.getElementById('mode-balance').classList.toggle('hidden', mode !== 'balance');
};

window.changeTeamCount = (delta) => {
    let val = parseInt(teamCountInput.value) + delta;
    if (val >= 2 && val <= 20) teamCountInput.value = val;
};

function addTierGroup(placeholder = "참가자 이름 입력") {
    const div = document.createElement('div');
    div.className = 'tier-card';
    div.innerHTML = `
        <button class="remove-tier" onclick="this.parentElement.remove()">✕ 삭제</button>
        <input type="text" placeholder="그룹명 (선택사항)" class="tier-name">
        <textarea rows="3" class="tier-members" placeholder="${placeholder}"></textarea>
    `;
    tierContainer.appendChild(div);
}

document.getElementById('addTierBtn').addEventListener('click', () => addTierGroup());

function handleGenerate(teams) {
    if(emptyResult) emptyResult.classList.add('hidden');
    resultArea.classList.add('hidden');
    loadingArea.classList.remove('hidden');

    setTimeout(() => {
        loadingArea.classList.add('hidden');
        renderResult(teams);
    }, 1500);
}

// 랜덤 팀 생성하기
document.getElementById('btn-simple').addEventListener('click', () => {
    const members = parseNames(document.getElementById('simple-names').value);
    if (members.length === 0) return alert("이름을 입력하세요!");
    const teamCount = parseInt(teamCountInput.value);
    const shuffled = members.sort(() => Math.random() - 0.5);
    const teams = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((m, i) => teams[i % teamCount].push(m));
    handleGenerate(teams);
});

// 밸런스 팀 생성하기 (티어 순서 유지 로직)
document.getElementById('btn-balance').addEventListener('click', () => {
    const tierCards = document.querySelectorAll('.tier-card');
    const teamCount = parseInt(teamCountInput.value);
    let teams = Array.from({ length: teamCount }, () => []);
    let hasData = false;

    tierCards.forEach((card) => {
        const groupMembers = parseNames(card.querySelector('.tier-members').value);
        if (groupMembers.length > 0) {
            hasData = true;
            groupMembers.sort(() => Math.random() - 0.5);
            groupMembers.forEach((member, index) => {
                teams[index % teamCount].push(member);
            });
        }
    });

    if (!hasData) return alert("명단을 입력하세요!");
    handleGenerate(teams);
});

function renderResult(teams) {
    teamsOutput.innerHTML = '';
    teams.forEach((members, idx) => {
        const div = document.createElement('div');
        div.className = 'team-card';
        div.innerHTML = `<h3>Team ${idx + 1} <small>(${members.length}명)</small></h3>`;
        const listDiv = document.createElement('div');
        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card masked';
            card.innerText = member;
            card.onclick = function() {
                this.classList.remove('masked');
                this.classList.add('revealed');
            };
            listDiv.appendChild(card);
        });
        div.appendChild(listDiv);
        teamsOutput.appendChild(div);
    });
    resultArea.classList.remove('hidden');
}

showAllBtn.onclick = () => {
    document.querySelectorAll('.member-card.masked').forEach((c, i) => {
        setTimeout(() => c.click(), i * 50);
    });
};

function parseNames(text) {
    return text.split(/[,\n]+/).map(n => n.trim()).filter(n => n !== "");
}

document.getElementById('copyBtn').onclick = () => {
    let text = "[ 팀 편성 결과 ]\n\n";
    document.querySelectorAll('.team-card').forEach(t => {
        text += t.querySelector('h3').innerText + "\n";
        text += Array.from(t.querySelectorAll('.member-card')).map(m => m.innerText).join(', ') + "\n\n";
    });
    navigator.clipboard.writeText(text).then(() => alert("복사 완료!"));
};

// =========================
// 후원 모달 동작
// =========================
const donateModal = document.getElementById('donateModal');
const openDonateBtn = document.getElementById('openDonateBtn');
const openDonateBtnFooter = document.getElementById('openDonateBtnFooter');
const closeDonateBtn = document.getElementById('closeDonateBtn');
const copyBankBtn = document.getElementById('copyBankBtn');
const bankInfoEl = document.getElementById('bankInfo');
const donateBankSection = document.getElementById('donateBankSection');
const donateProviderNameEl = document.getElementById('donateProviderName');
const donateProviderLinkEl = document.getElementById('donateProviderLink');

function openDonateModal() {
    if (!donateModal) return;
    donateModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDonateModal() {
    if (!donateModal) return;
    donateModal.classList.add('hidden');
    document.body.style.overflow = '';
}

[openDonateBtn, openDonateBtnFooter].filter(Boolean).forEach(btn => {
    btn.addEventListener('click', openDonateModal);
});
if (closeDonateBtn) closeDonateBtn.addEventListener('click', closeDonateModal);

if (donateModal) {
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) closeDonateModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (!donateModal) return;
    if (e.key === 'Escape' && !donateModal.classList.contains('hidden')) closeDonateModal();
});

// 후원 링크 바인딩 (미설정이면 안내)
// 외부 후원(금액 버튼) 바인딩
if (donateProviderNameEl) {
    donateProviderNameEl.textContent = DONATION_CONFIG.providerName || "External";
}
if (donateProviderLinkEl) {
    const providerUrl = buildProviderUrl();
    if (providerUrl) donateProviderLinkEl.setAttribute('href', providerUrl);

    donateProviderLinkEl.addEventListener('click', (ev) => {
        const url = buildProviderUrl();
        if (!url) {
            ev.preventDefault();
            alert("후원 링크가 아직 설정되지 않았습니다.\n\nKo-fi면 DONATION_CONFIG.kofiId만 입력하면 됩니다.");
        }
    });
}

// amount 버튼들 구성
document.querySelectorAll('[data-amount]').forEach((btn) => {
    const amount = Number(btn.dataset.amount);
    if (!Number.isFinite(amount)) return;

    btn.addEventListener('click', () => {
        const url = buildDonationUrl(amount);
        if (!url) {
            alert("후원 링크가 아직 설정되지 않았습니다.\n\nscript.js의 DONATION_CONFIG.urlTemplate 또는 baseUrl을 입력해주세요.");
            return;
        }
        window.open(url, "_blank", "noopener");
    });
});

// 계좌 텍스트 + 복사
if (bankInfoEl) {
    bankInfoEl.textContent = maskBankForDisplay(DONATION_CONFIG.bankText) || "계좌 정보가 아직 설정되지 않았습니다.";
}
if (donateBankSection) {
    donateBankSection.classList.toggle('hidden', !String(DONATION_CONFIG.bankText || "").trim());
}


function buildDonationUrl(amount) {
    const tpl = String(DONATION_CONFIG.urlTemplate || "").trim();
    const base = String(DONATION_CONFIG.baseUrl || "").trim();
    const kofiId = String(DONATION_CONFIG.kofiId || "").trim();

    if (tpl) {
        return tpl
            .replaceAll("{amount}", encodeURIComponent(String(amount)))
            .replaceAll("{id}", encodeURIComponent(kofiId));
    }

    // Ko-fi 기본 링크 (금액 지정 파라미터를 지원하는 경우 바로 해당 금액으로 열림)
    if (kofiId) return `https://ko-fi.com/${encodeURIComponent(kofiId)}?amount=${encodeURIComponent(String(amount))}`;
    if (base) return base;
    return "";
}

function buildProviderUrl() {
    const base = String(DONATION_CONFIG.baseUrl || "").trim();
    const tpl = String(DONATION_CONFIG.urlTemplate || "").trim();
    const kofiId = String(DONATION_CONFIG.kofiId || "").trim();

    if (base) return base;
    if (kofiId) return `https://ko-fi.com/${encodeURIComponent(kofiId)}`;
    if (tpl) {
        const fallbackAmount = Array.isArray(DONATION_CONFIG.amounts) ? DONATION_CONFIG.amounts[0] : 10;
        return tpl
            .replaceAll("{amount}", encodeURIComponent(String(fallbackAmount)))
            .replaceAll("{id}", encodeURIComponent(kofiId));
    }
    return "";
}