;(function () {
  function getGeminiApiKey() {
    const storedApiKey = localStorage.getItem('geminiApiKey')
    if (storedApiKey) return atob(storedApiKey)
    alert('API Key Gemini tidak ditemukan di localStorage!')
    throw new Error('Gemini API Key not found in localStorage')
  }

  async function askGeminiWithContent(
    content,
    mode = 'default',
    prevAnswer = ''
  ) {
    const GEMINI_API_KEY = getGeminiApiKey()
    let prompt = ''
    const hasNumberedQuestions = /\b1\.[\s\S]*2\./.test(content)
    if (mode === 'default') {
      prompt =
        `Bacalah diskusi berikut, lalu tuliskan jawaban atau rangkuman yang natural, mengalir, dan mudah dipahami seperti jawaban manusia. Hindari tanda bintang, bullet, atau penomoran. Jika memungkinkan, gunakan satu atau dua paragraf saja, jangan ucapkan "Tentu, ini rangkumannya:\n" atau semacamnya, langsung jawab saja. Jika terdapat soal atau pertanyaan yang berhubungan dengan bahasa pemrograman atau coding, berikan contoh singkat code nya` +
        (hasNumberedQuestions
          ? ` Jika terdapat beberapa pertanyaan bernomor (misal: 1. ... 2. ...), jawab setiap pertanyaan secara berurutan. Untuk setiap pertanyaan, awali jawaban dengan angka yang sesuai (misal: 1..., 2..., 3..., dst), lalu tuliskan jawaban natural satu paragraf untuk setiap nomor. Jangan gunakan bullet, penomoran ulang, atau format lain selain angka yang sesuai dengan soal.`
          : '') +
        `\n\n${content}\n\nJawaban:`
    } else if (mode === 'shorten') {
      prompt = `Ringkas jawaban berikut menjadi lebih singkat, tetap natural dan mudah dipahami, tanpa bullet atau penomoran:\n\n${prevAnswer}`
    } else if (mode === 'clarify') {
      prompt = `Perjelas dan buat jawaban berikut lebih mudah dipahami, tetap natural dan tidak seperti AI, tanpa bullet atau penomoran:\n\n${prevAnswer}`
    } else if (mode === 'lengthen') {
      prompt = `Perpanjang dan tambahkan detail pada jawaban berikut, tetap natural dan mudah dipahami, tanpa bullet atau penomoran:\n\n${prevAnswer}`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Gagal mendapatkan jawaban dari Gemini')
    }
    const data = await response.json()
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Tidak ada jawaban dari Gemini.'
    )
  }

  function addCariJawabanButtons() {
    document
      .querySelectorAll(
        '.MuiStack-root .MuiButton-root.MuiButton-containedSuccess'
      )
      .forEach((replyBtn) => {
        if (replyBtn.parentElement.querySelector('.cari-jawaban-btn')) return

        const rootPaper = replyBtn.closest('.MuiPaper-root')
        const isDosen =
          rootPaper &&
          rootPaper.querySelector(
            '.MuiTypography-root span[style*="font-weight: bold;"]'
          ) &&
          rootPaper
            .querySelector(
              '.MuiTypography-root span[style*="font-weight: bold;"]'
            )
            .textContent.match(
              /\b(?:S\.Kom|M\.Kom|Dr|Prof|S\.Pd|M\.Pd|Dosen)\b/i
            )

        let buatBtn = null
        if (isDosen) {
          buatBtn = document.createElement('button')
          buatBtn.type = 'button'
          buatBtn.className =
            'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedInfo MuiButton-sizeSmall MuiButton-containedSizeSmall buat-pertanyaan-btn'
          buatBtn.style =
            'margin-right:2px;min-width:0px;padding:7px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#1e3a8a;color:#fff;border:0;display:flex;align-items:center;gap:4px;'
          buatBtn.innerHTML = `
          <span class=\"MuiButton-startIcon\" style=\"display:inline-flex;align-items:center;\">
            <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M12 8v4\"></path><path d=\"M12 16h.01\"></path></svg>
          </span>
          <span class=\"MuiButton-label\">Buat Pertanyaan</span>`
          replyBtn.parentElement.insertBefore(buatBtn, replyBtn)
          buatBtn.addEventListener('click', async () => {
            buatBtn.disabled = true
            buatBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M12 8v4\"></path><path d=\"M12 16h.01\"></path></svg></span><span class=\"MuiButton-label\">Memproses...</span>`
            const ckContents = rootPaper.querySelectorAll('.ck-content')
            const content =
              (ckContents[1] && getCkContentWithListNumbering(ckContents[1])) ||
              (ckContents[0] && getCkContentWithListNumbering(ckContents[0])) ||
              ''
            try {
              const prompt = `Bacalah diskusi berikut, lalu buatkan beberapa saran pertanyaan yang natural, relevan, dan menarik untuk diajukan pada diskusi ini. Hindari bullet, penomoran, dan buat seolah-olah pertanyaan dari manusia. Pisahkan setiap pertanyaan dengan baris baru. Pastikan setiap saran pertanyaan berdiri sendiri, tidak saling terhubung, dan tidak menggunakan kata penghubung seperti 'selain itu', 'terus', 'dan' di awal kalimat.\n\n${content}\n\nSaran pertanyaan:`
              const GEMINI_API_KEY = getGeminiApiKey()
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 512,
                      topP: 0.95,
                      topK: 40,
                    },
                  }),
                }
              )
              if (!response.ok)
                throw new Error(
                  'Gagal mendapatkan saran pertanyaan dari Gemini'
                )
              const data = await response.json()
              let saran =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                'Tidak ada saran pertanyaan.'
              let saranArr = saran.split(/\n+/).filter(Boolean)
              let saranDiv = rootPaper.querySelector('.saran-pertanyaan-gemini')
              if (!saranDiv) {
                saranDiv = document.createElement('div')
                saranDiv.className = 'saran-pertanyaan-gemini'
                saranDiv.style =
                  'margin:10px 0 0 0;padding:10px;background:#fffbe7;color:#000;border-radius:18px;border:1px solid #ffe082;font-size:13px;display:flex;flex-direction:column;gap:8px;'
                replyBtn.parentElement.parentElement.appendChild(saranDiv)
              }
              saranDiv.innerHTML = `<b>Saran Pertanyaan:</b>`
              saranArr.forEach((q, idx) => {
                const qWrap = document.createElement('div')
                qWrap.style =
                  'display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;'
                const textBox = document.createElement('div')
                textBox.textContent = q.trim()
                textBox.style =
                  'flex:1 1 200px;padding:14px 54px 14px 12px;position:relative;border-radius:18px;background:#fff9d8;color:#333;font-size:13px;word-break:break-word;min-height:36px;'
                const copyBtn = document.createElement('button')
                copyBtn.type = 'button'
                copyBtn.className =
                  'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall'
                copyBtn.style =
                  'position:absolute;right:8px;bottom:8px;min-width:0px;padding:4px 8px;line-height:1.2;font-weight:500;border-radius:9px;background:rgb(255, 179, 0);color:#1e1e1e;border:0;display:flex;align-items:center;gap:4px;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,0.07);'
                copyBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg></span><span class=\"MuiButton-label\">Copy</span>`
                copyBtn.onclick = () => {
                  navigator.clipboard.writeText(q.trim()) 
                  copyBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg></span><span class=\"MuiButton-label\">Copied!</span>`
                  setTimeout(
                    () =>
                      (copyBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg></span><span class=\"MuiButton-label\">Copy</span>`),
                    1200
                  )
                }
                textBox.appendChild(copyBtn)
                qWrap.appendChild(textBox)
                saranDiv.appendChild(qWrap)
              })
            } catch (err) {
              alert('Gagal mendapatkan saran pertanyaan: ' + err.message)
            }
            buatBtn.disabled = false
            buatBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M12 8v4\"></path><path d=\"M12 16h.01\"></path></svg></span><span class=\"MuiButton-label\">Buat Pertanyaan</span>`
          })
        }

        const cariBtn = document.createElement('button')
        cariBtn.type = 'button'
        cariBtn.className =
          'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedWarning MuiButton-sizeSmall MuiButton-containedSizeSmall cari-jawaban-btn'
        cariBtn.style =
          'margin-right:2px;min-width:0px;padding:7px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#41a3f1;color:rgb(255,255,255);border:0;display:flex;align-items:center;gap:4px;'
        cariBtn.innerHTML = `
        <span class=\"MuiButton-startIcon\" style=\"display:inline-flex;align-items:center;\">
          <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg>
        </span>
        <span class=\"MuiButton-label\">Cari Jawaban</span>`

        replyBtn.parentElement.insertBefore(cariBtn, replyBtn)

        cariBtn.addEventListener('click', async (e) => {
          cariBtn.disabled = true
          cariBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg></span><span class=\"MuiButton-label\">Mencari...</span>`
          const rootPaper = replyBtn.closest('.MuiPaper-root')
          if (!rootPaper) return
          const ckContents = rootPaper.querySelectorAll('.ck-content')
          let content = ''
          content =
            (ckContents[1] && getCkContentWithListNumbering(ckContents[1])) ||
            (ckContents[0] && getCkContentWithListNumbering(ckContents[0])) ||
            ''
          if (!content) {
            alert('Konten diskusi tidak ditemukan!')
            cariBtn.disabled = false
            cariBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg></span><span class=\"MuiButton-label\">Cari Jawaban</span>`
            return
          }
          try {
            const jawaban = await askGeminiWithContent(content)
            showJawabanBox(jawaban, replyBtn, rootPaper, content)
          } catch (err) {
            alert('Gagal mendapatkan jawaban: ' + err.message)
          }
          cariBtn.disabled = false
          cariBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg></span><span class=\"MuiButton-label\">Cari Jawaban</span>`
        })
      })
  }

  function formatNumberedAnswers(content, jawaban) {
    const matches = [...content.matchAll(/\b(\d+)\./g)]
    if (matches.length < 2) return jawaban
    const total = matches.length
    let parts = jawaban.split(/\n{2,}|\r{2,}|\n\r|\r\n/).filter(Boolean)
    let alreadyNumbered = parts.every((p, i) => p.trim().startsWith(i + 1 + ''))
    if (alreadyNumbered) return jawaban
    if (parts.length < total) {
      parts = jawaban.split(/\n|\r/).filter(Boolean)
    }
    if (parts.length < total) {
      const avgLen = Math.floor(jawaban.length / total)
      parts = []
      for (let i = 0; i < total; i++) {
        parts.push(jawaban.slice(i * avgLen, (i + 1) * avgLen))
      }
    }
    const formatted = parts
      .slice(0, total)
      .map((p, i) => `${i + 1}. ${p.trim()}`)
      .join('\n\n')
    return formatted
  }

  function showJawabanBox(jawaban, replyBtn, rootPaper, originalContent) {
    let resultDiv = rootPaper.querySelector('.jawaban-gemini')
    if (!resultDiv) {
      resultDiv = document.createElement('div')
      resultDiv.className = 'jawaban-gemini'
      resultDiv.style =
        'margin:10px 0 0 0;padding:10px;background:#fffbe7;color:#333;border-radius:18px;border:1px solid #ffe082;font-size:13px;display:flex;flex-direction:column;gap:8px;'
      replyBtn.parentElement.parentElement.appendChild(resultDiv)
    }
    let formattedJawaban = jawaban
    if (originalContent && /\b1\.[\s\S]*2\./.test(originalContent)) {
      formattedJawaban = formatNumberedAnswers(originalContent, jawaban)
    }
    resultDiv.innerHTML = `<b>Jawaban:</b><div style='margin-bottom:6px;white-space:pre-line;'>${formattedJawaban}</div>`
    const btnRow = document.createElement('div')
    btnRow.style = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;'

    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.className =
      'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall'
    copyBtn.style =
      'margin-right:0;min-width:0px;padding:6px 10px;line-height:1.2;font-weight:500;border-radius:11px;background:rgb(255, 179, 0);color:#1e1e1e;border:0;display:flex;align-items:center;gap:4px;'
    copyBtn.innerHTML = `
      <span class=\"MuiButton-startIcon\" style=\"display:inline-flex;align-items:center;\">
        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg>
      </span>
      <span class=\"MuiButton-label\">Copy</span>`
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(jawaban)
      copyBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg></span><span class=\"MuiButton-label\">Copied!</span>`
      setTimeout(
        () =>
          (copyBtn.innerHTML = `<span class=\"MuiButton-startIcon\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg></span><span class=\"MuiButton-label\">Copy</span>`),
        1200
      )
    }
    btnRow.appendChild(copyBtn)
    const revisiList = [
      { mode: 'shorten', label: 'Ringkas' },
      { mode: 'clarify', label: 'Perjelas' },
      { mode: 'lengthen', label: 'Perpanjang' },
    ]
    revisiList.forEach(({ mode, label }) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className =
        'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedSecondary MuiButton-sizeSmall MuiButton-containedSizeSmall'
      btn.style =
        'margin-right:0;min-width:0px;padding:6px 10px;line-height:1.2;font-weight:500;border-radius:11px;background:rgb(66, 66, 66);color:rgb(225,225,225);border:0'
      btn.innerHTML = `<span class=\"MuiButton-label\">${label}</span>`
      btn.onclick = async () => {
        btn.innerHTML = `<span class=\"MuiButton-label\">Memproses...</span>`
        btn.disabled = true
        try {
          const revisiJawaban = await askGeminiWithContent(
            originalContent,
            mode,
            jawaban
          )
          showJawabanBox(revisiJawaban, replyBtn, rootPaper, originalContent)
        } catch (err) {
          alert('Gagal merevisi jawaban: ' + err.message)
        }
        btn.innerHTML = `<span class=\"MuiButton-label\">${label}</span>`
        btn.disabled = false
      }
      btnRow.appendChild(btn)
    })
    resultDiv.appendChild(btnRow)
  }

  function getCkContentWithListNumbering(ckContentElem) {
    function traverse(node, olLevel = 0) {
      let result = ''
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'OL') {
          let idx = 1
          for (const child of node.children) {
            if (child.tagName === 'LI') {
              result += `${idx}. ${traverse(child, olLevel + 1).trim()}\n`
              idx++
            }
          }
        } else if (node.tagName === 'UL') {
          for (const child of node.children) {
            if (child.tagName === 'LI') {
              result += `- ${traverse(child, olLevel).trim()}\n`
            }
          }
        } else if (node.tagName === 'LI') {
          let text = ''
          for (const child of node.childNodes) {
            text += traverse(child, olLevel)
          }
          result += text
        } else {
          for (const child of node.childNodes) {
            result += traverse(child, olLevel)
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent
      }
      return result
    }
    return traverse(ckContentElem).trim()
  }

  let lastUrl = window.location.href;
  let targetElementInterval = null;
  function waitForTargetElement(callback, selector, timeout = 10000, interval = 250) {
      if (targetElementInterval) clearInterval(targetElementInterval);

      let startTime = Date.now();
      
      targetElementInterval = setInterval(() => {
          const target = document.querySelector(selector);
          
          if (target) {
              clearInterval(targetElementInterval);
              callback();
          } else if (Date.now() - startTime >= timeout) {
              clearInterval(targetElementInterval);
              console.warn('Tombol Reply tidak ditemukan dalam batas waktu.');
          }
      }, interval);
  }


  function handleForumMutations() {
      if (!window.location.href.includes('/forum/')) return;
      addCariJawabanButtons();
  }

  handleForumMutations() 

  const observer = new MutationObserver(() => {
    handleForumMutations();
  })
  
  observer.observe(document.body, { childList: true, subtree: true })
  setInterval(() => {
      const currentUrl = window.location.href;

      if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          
          if (currentUrl.includes('/forum/')) {
              console.log('Navigasi ke Forum Terdeteksi. Menunggu elemen target...');
              
              observer.disconnect();
              
              waitForTargetElement(() => {
                  handleForumMutations();
                  
                  observer.observe(document.body, { childList: true, subtree: true });
              }, '.MuiButton-containedSuccess');
              
          } else {
              observer.observe(document.body, { childList: true, subtree: true });
          }
      }
  }, 300); 
})()
