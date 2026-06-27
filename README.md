<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>قاری اکرم وائس ٹائپنگ</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Nastaliq Urdu', serif; background-color: #fdfdfd; direction: rtl; margin: 0; padding: 10px; text-align: center; }
        .header { background: #075e54; color: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; }
        #output { width: 100%; height: 60vh; background: white; border-radius: 15px; padding: 15px; font-size: 24px; line-height: 2.2; border: 2px solid #075e54; overflow-y: auto; box-sizing: border-box; margin-bottom: 15px; text-align: right; white-space: pre-wrap; }
        .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        button { padding: 15px; font-size: 18px; border: none; border-radius: 12px; cursor: pointer; color: white; font-family: 'Noto Nastaliq Urdu', serif; font-weight: bold; }
        .start { background: #25d366; } .stop { background: #e91e63; }
        .copy { background: #34b7f1; grid-column: span 2; }
        #status { margin-top: 10px; font-weight: bold; color: #555; }
    </style>
</head>
<body>
    <div class="header"><h1>قاری اکرم وائس ٹائپنگ</h1></div>
    <div id="output" contenteditable="true">یہاں آواز تحریر بنے گی...</div>
    <div class="btns">
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
