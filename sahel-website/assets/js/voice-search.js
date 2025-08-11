function startVoiceSearch(targetInputId='search-input') {
  const input = document.getElementById(targetInputId);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('متصفحك لا يدعم البحث الصوتي');
    return;
  }
  const rec = new SpeechRecognition();
  rec.lang = 'ar-EG';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
    const form = input.closest('form');
    if (form) form.submit();
  };
  rec.onerror = () => alert('تعذر استخدام البحث الصوتي');
  rec.start();
}

window.startVoiceSearch = startVoiceSearch;