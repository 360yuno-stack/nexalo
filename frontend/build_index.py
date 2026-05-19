import re

base = r"c:\Users\Anny\NEXALO\nexalo\frontend"

# Read the ORIGINAL backup
with open(f"{base}\\index_backup_20260513.html", "r", encoding="utf-8-sig") as f:
    html = f.read()

# Read partials
def read_partial(name):
    with open(f"{base}\\partials\\{name}", "r", encoding="utf-8") as f:
        return f.read()

acct = read_partial("account_investor.html")
treas = read_partial("treasury.html")
stak = read_partial("staking.html")
faqc = read_partial("faq.html")
foot = read_partial("footer.html")

# 1) Replace Mi Cuenta + old investor: from "<!-- MI CUENTA SECTION -->" to just before "<!-- EMBAJADORES SECTION -->"
# The original has malformed content starting with "<!-- MI CUENTA SECTION -->" followed by orphaned <p> tags and old pools
pat1 = r'  <!-- MI CUENTA SECTION -->.*?(?=\s*<!-- EMBAJADORES SECTION -->)'
html = re.sub(pat1, acct + "\n\n", html, flags=re.DOTALL)
print("Step 1 (Mi Cuenta + Investor):", "OK" if "account-section" in html else "FAILED")

# 2) Replace Treasury: from "<!-- TREASURY & YIELD SECTION -->" to before "<!-- IMPACTO GLOBAL SECTION -->"
pat2 = r'  <!-- TREASURY & YIELD SECTION -->.*?(?=\s*<!-- IMPACTO GLOBAL SECTION -->)'
html = re.sub(pat2, treas + "\n\n", html, flags=re.DOTALL)
print("Step 2 (Treasury):", "OK" if "Aave v3 Integration" in html else "FAILED")

# 3) Replace Staking: from "<!-- STAKING SECTION -->" to before "<!-- VIDEOS SECTION -->"
pat3 = r'  <!-- STAKING SECTION -->.*?(?=\s*<!-- VIDEOS SECTION -->)'
html = re.sub(pat3, stak + "\n\n", html, flags=re.DOTALL)
print("Step 3 (Staking):", "OK" if "Rendimiento Pasivo" in html else "FAILED")

# 4) Replace FAQ: from "<!-- FAQ / CHAT SECTION -->" to before "<footer"
pat4 = r'  <!-- FAQ / CHAT SECTION -->.*?(?=\s*<footer)'
html = re.sub(pat4, faqc + "\n\n", html, flags=re.DOTALL)
print("Step 4 (FAQ):", "OK" if "NEXALO ASSISTANT" in html else "FAILED")

# 5) Replace Footer: from old "<footer..." to "</footer>"
pat5 = r'  <footer class="py-12.*?</footer>'
html = re.sub(pat5, foot, html, flags=re.DOTALL)
print("Step 5 (Footer):", "OK" if "DeFi Protocol" in html else "FAILED")

# 6) Add helpers.js script before i18n.js
html = html.replace(
    '  <script src="./js/i18n.js"></script>',
    '  <script src="./js/helpers.js"></script>\n  <script src="./js/i18n.js"></script>'
)
print("Step 6 (helpers.js):", "OK" if "helpers.js" in html else "FAILED")

# 7) Add staking stubs before closing </script>
staking_js = """
  // Staking stubs
  async function stakeNXL() {
    alert('Staking NXL en integración final. El contrato StakingVault será desplegado en mainnet.');
  }
  async function unstakeNXL() {
    alert('Unstake NXL en integración final.');
  }
  async function stakeMaxNXL() {
    if (!S.nxlRead || !S.account) { alert('Conecta tu wallet'); return; }
    try {
      const bal = await S.nxlRead.balanceOf(S.account);
      const dec = await S.nxlRead.decimals();
      var inp = document.getElementById('staking-input');
      if (inp) inp.value = ethers.utils.formatUnits(bal, dec);
    } catch(e) { console.warn(e); }
  }
  async function claimStakingRewards() {
    alert('Claim WBTC en integración final. El contrato StakingVault será desplegado en mainnet.');
  }
  window.stakeNXL = stakeNXL;
  window.unstakeNXL = unstakeNXL;
  window.stakeMaxNXL = stakeMaxNXL;
  window.claimStakingRewards = claimStakingRewards;
"""
html = html.replace(
    '  window.redeemNXL = redeemNXLFrontend;',
    '  window.redeemNXL = redeemNXLFrontend;\n' + staking_js
)
print("Step 7 (Staking JS):", "OK" if "stakeNXL" in html else "FAILED")

# Write output
with open(f"{base}\\index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("\n=== BUILD COMPLETE ===")
print(f"Output size: {len(html)} bytes, {html.count(chr(10))} lines")
