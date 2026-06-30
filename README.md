    <div <!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>قاری اکرم وائس اینڈ فائل ٹائپنگ</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Nastaliq Urdu', serif; background-color: #f0f2f5; direction: rtl; margin: 0; padding: 10px; text-align: center; }
        .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: #075e54; color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; }
        
        #output { width: 100%; height: 50vh; background: #fff; border-radius: 10px; padding: 15px; font-size: 22px; line-height: 2.2; border: 2px solid #075e54; overflow-y: auto; box-sizing: border-box; margin-bottom: 15px; text-align: right; white-space: pre-wrap; }
        
        .upload-section { background: #e7f3f0; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px dashed #075e54; }
        audio { width: 100%; margin-top: 10px; }

        .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        button { padding: 15px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer; color: white; font-family: 'Noto Nastaliq Urdu', serif; font-weight: bold; transition: 0.3s; }
        
        .start { background: #25d366; } .stop { background: #e91e63; }
        .copy { background: #34b7f1; } .clear { background: #757575; }
        button:hover { opacity: 0.8; }
        
        #status { margin-top: 10px; font-weight: bold; font-size: 14px; }
        .loader { display: none; color: red; animation: blink 1s infinite; }
        @keyframes blink { 0% {opacity: 1;} 50% {opacity: 0.3;} 100% {opacity: 1;} }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>قاری اکرم وائس اینڈ فائل ٹائپنگ</h1>
    </div>

    <!-- آڈیو فائل اپ لوڈ سیکشن -->
    <div class="upload-section">
        <strong>ریکارڈ شدہ لیکچر فائل یہاں سے منتخب کریں:</strong><br>
        <input type="file" id="audioUpload" accept="audio/*" onchange="loadAudio(event)">
        <audio id="audioPlayer" controls></audio>
        <p style="font-size: 12px; color: #555;">(فائل چلا کر 'ٹائپنگ شروع کریں' کا بٹن دبائیں)</p>
    </div>

    <div id="output" contenteditable="true">یہاں تحریر لکھی جائے گی...</div>

    <div class="btns">
        <button class="start" onclick="startRecognition()">ٹائپنگ شروع کریں</button>
        <button class="stop" onclick="stopRecognition()">روک دیں</button>
        <button class="copy" onclick="copyText()">تحریر کاپی کریں</button>
        <button class="clear" onclick="clearText()">صاف کریں</button>
    </div>

    <p id="status">اسٹیٹس: تیار ہے <span class="loader" id="loader">●</span></p>
</div>

<script>
    var output = document.getElementById('output');
    var status = document.getElementById('status');
    var loader = document.getElementById('loader');
    var audioPlayer = document.getElementById('audioPlayer');
    
    var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    recognition.lang = 'ur-PK';
    recognition.continuous = false; // جملوں کے دہراؤ سے بچنے کے لیے اسے false رکھا ہے
    recognition.interimResults = true;

    var isRecording = false;
    var final_text = ""; 

    // جملوں کو بار بار لکھنے سے روکنے کے لیے چیک
    var lastSentences = new Set();

    recognition.onstart = function() {
        isRecording = true;
        loader.style.display = "inline";
        status.style.color = "red";
        status.innerHTML = "اسٹیٹس: سسٹم سن رہا ہے... ";
    };

    recognition.onresult = function(event) {
        var interim_transcript = '';
        var current_final = '';

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            var transcript = event.results[i][0].transcript.trim();
            if (event.results[i].isFinal) {
                // چیک کریں کہ کیا یہ جملہ پہلے ہی تو نہیں آ گیا؟
                if (!lastSentences.has(transcript)) {
                    current_final += transcript + ' ';
                    lastSentences.add(transcript);
                    // میموری صاف رکھنے کے لیے سیٹ کو محدود رکھیں
                    if(lastSentences.size > 10) lastSentences.delete(Array.from(lastSentences)[0]);
                }
            } else {
                interim_transcript += transcript;
            }
        }

        if (current_final !== "") {
            final_text += current_final;
        }

        output.innerHTML = final_text + '<span style="color:#999">' + interim_transcript + '</span>';
        output.scrollTop = output.scrollHeight;
    };

    recognition.onend = function() {
        if (isRecording) {
            recognition.start(); // خودکار ری اسٹارٹ تاکہ لمبا لیکچر ٹائپ ہو سکے
        } else {
            loader.style.display = "none";
            status.style.color = "black";
            status.innerHTML = "اسٹیٹس: ٹائپنگ روک دی گئی ہے";
        }
    };

    function startRecognition() {
        if (!isRecording) {
            if(output.innerText == "یہاں تحریر لکھی جائے گی...") output.innerText = "";
            final_text = output.innerText; 
            isRecording = true;
            recognition.start();
        }
    }

    function stopRecognition() {
        isRecording = false;
        recognition.stop();
        audioPlayer.pause();
    }

    function loadAudio(event) {
        var file = event.target.files[0];
        if (file) {
            var url = URL.createObjectURL(file);
            audioPlayer.src = url;
        }
    }

    function copyText() {
        navigator.clipboard.writeText(output.innerText);
        alert("تحریر کاپی ہو گئی ہے!");
    }

    function clearText() {
        if(confirm("کیا آپ پوری تحریر مٹانا چاہتے ہیں؟")) {
            final_text = "";
            lastSentences.clear();
            output.innerText = "";
        }
    }
</script>

</body>
</html>
        <button class="start" onclick="startRecognition()">شروع کریں</button>
        <button class="stop" onclick="stopRecognition()">روک دیں</button>
        <button class="copy" onclick="copyText()">تحریر کاپی کریں</button>
    </div>
    <p id="status">اسٹیٹس: تیار ہے</p>

    <script>
        var output = document.getElementById('output');
        var status = document.getElementById('status');
        var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        recognition.lang = 'ur-PK';
        recognition.continuous = true;
        recognition.interimResults = true;

        var final_text = ''; 
        var isRecording = false;

        recognition.onstart = function() {
            isRecording = true;
            status.innerHTML = "🔴 ریکارڈنگ جاری ہے...";
            status.style.color = "red";
        };

        recognition.onresult = function(event) {
            var interim_transcript = '';
            // ہم صرف موجودہ سیشن کے رزلٹس کو دیکھ رہے ہیں تاکہ دہراؤ نہ ہو
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_text += event.results[i][0].transcript + ' ';
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            // آؤٹ پٹ کو اپ ڈیٹ کریں
            output.innerHTML = final_text + '<span style="color:#999">' + interim_transcript + '</span>';
            output.scrollTop = output.scrollHeight;
        };

        recognition.onend = function() {
            if (isRecording) {
                // اگر خود نہیں روکا تو دوبارہ شروع کریں لیکن پرانا ٹیکسٹ محفوظ رکھتے ہوئے
                recognition.start();
            } else {
                status.innerHTML = "اسٹیٹس: رک گئی ہے";
                status.style.color = "black";
            }
        };

        recognition.onerror = function(event) {
            console.log("Error: " + event.error);
        };

        function startRecognition() {
            if (!isRecording) {
                // شروع کرنے سے پہلے موجودہ ٹیکسٹ کو یاد رکھیں تاکہ وہ مٹے نہیں
                final_text = output.innerText.replace("یہاں آواز تحریر بنے گی...", "") + ' ';
                recognition.start();
            }
        }

        function stopRecognition() {
            isRecording = false;
            recognition.stop();
        }

        function copyText() {
            var text = output.innerText;
            navigator.clipboard.writeText(text).then(function() {
                alert("تحریر کاپی ہو گئی!");
            });
        }
    </script>
</body>
</html>
# Qari-Akram-typing
یہ سائیڈ بول کر لکھنا وائس لیکچر کو اردو میں ٹائپ کرنے کے لیے محترم قاری محمد اکرم قاسمی صاحب نے بنائی ہے.. جو کہ بہت بڑا کام کیا ہے 
