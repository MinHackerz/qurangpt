const contentInput = document.getElementById('contentInput');
const askQuranBtn = document.getElementById('askQuranBtn');
const resetBtn = document.getElementById('resetBtn');
const summaryOutput = document.getElementById('summaryOutput');
const processingDiv = document.querySelector('.processing');
const copyBtn = document.getElementById('copyBtn');
const copyContainer = document.querySelector('.copy-container');

askQuranBtn.addEventListener('click', askQuran);
resetBtn.addEventListener('click', resetForm);
copyBtn.addEventListener('click', copyContent);

function askQuran() {
    const question = contentInput.value.trim();

    if (question.length === 0) {
        return;
    }

    askQuranBtn.disabled = true;
    processingDiv.style.display = 'flex';
    summaryOutput.innerHTML = '';
    summaryOutput.style.display = 'none';
    copyContainer.style.display = 'none';

    const prompt = `**Introduction:**

I am Quran GPT, an AI-based Quranic Library, and an experienced Islamic Scholar/Researcher. My task is to answer your questions by providing references from the Holy Quran. I will always include at least one to three relevant Ayahs of the Quran to support my answers.

**Answering Format:**

I will respond to your questions as Quran GPT, and in every answer, I will include Quranic references to support my response. I will use references from different Surahs/Verses of the Holy Quran to ensure accuracy.

**Reference Format:**

I will provide the answer in the following format:

### Quran GPT's Answer:

**Allah(SWT) says in the Glorious Quran:**

_"Ayah of the Quran"_

_--- (Surah - " ": Ayah No. - " ")_

**Explanation and Tafseer:**

I will explain the Ayahs of the Quran provided as references in a peaceful and polite manner. My explanations will be authoritative, precise, and easy to understand.

**Additional Information:**

I will include one Tafseer related to the Ayah used in the reference. The Tafseer will be from reputable Islamic scholars and will provide further insights into the Ayah.

**References:**

1. [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

2. [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

3. ..................................................

]

Please note that you should replace \`{Surah No.}\` and \`{Ayah No.}\` with the actual Surah and Ayah numbers when you use this format to answer questions.

Question: ${question}

Answer:`;

    generate_response_with_gemini(prompt)
        .then(response => {
            const formattedResponse = response.replace(/###/g, '\n\n###')
                                                .replace(/\*\*\*\*\*\*/g, '**')
                                                .replace(/\*\*\*/g, '***')
                                                .replace(/\*\*([^*]*)\*\*/g, '**$1**')
                                                .replace(/\_\_([^_]*)\_\_/g, '_$1_');
            summaryOutput.textContent = formattedResponse;
            summaryOutput.style.display = 'block';
            copyContainer.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error generating response:', error);
        })
        .finally(() => {
            askQuranBtn.disabled = false;
            processingDiv.style.display = 'none';
        });
}

function resetForm() {
    contentInput.value = '';
    summaryOutput.textContent = '';
    summaryOutput.style.display = 'none';
    copyContainer.style.display = 'none';
}

function insertQuestion(question) {
    contentInput.value = question;
}

function copyContent() {
    const summary = summaryOutput.textContent;
    navigator.clipboard.writeText(summary)
        .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 1000);
        })
        .catch((error) => {
            console.error('Failed to copy summary:', error);
        });
}

async function generate_response_with_gemini(prompt) {
    const apiKey = 'AIzaSyBq6CK24S5pm6mPdc_dfdbbPBpiSb_kvYo'; // Replace with your actual API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const headers = {
        'Content-Type': 'application/json'
    };

    const body = {
        'contents': [
            {
                'parts': [
                    { 'text': prompt }
                ]
            }
        ]
    };

    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    };

    try {
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      if (response.ok) {
        const extractedText = data.candidates[0].content.parts[0].text;
        return extractedText;
    } else {
        throw new Error('Error generating response from Gemini API');
    }
} catch (error) {
    console.error('Error:', error);
    throw error;
}
}
