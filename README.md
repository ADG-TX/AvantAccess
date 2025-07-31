# AvantAccess
Avant Access provides a streamlined experience for Avant Development Group clients. This secure repository allows garage owners to effortlessly submit essential project information and specify their unique HVAC customization preferences, ensuring a precise and personalized installation!

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AvantAccess - GOTA HVAC Customization</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 class="text-2xl font-bold mb-2 text-center">AvantAccess</h1>
        <h2 class="text-xl font-semibold mb-4 text-center">GOTA HVAC Customization</h2>
        <p class="mb-6 text-gray-600">Welcome, Garages of the Americas (GOTA) owners! AvantAccess, brought to you by Avant Development Group, offers a streamlined experience to submit your project details and HVAC customization preferences for a precise, personalized installation.</p>
        <form id="hvacForm" enctype="multipart/form-data" class="space-y-4">
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" name="name" required class="mt-1 p-2 w-full border rounded-md focus:ring focus:ring-blue-300">
            </div>
            <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" id="phone" name="phone" required class="mt-1 p-2 w-full border rounded-md focus:ring focus:ring-blue-300">
            </div>
            <div>
                <label for="garage" class="block text-sm font-medium text-gray-700">Garage Number</label>
                <select id="garage" name="garage" required class="mt-1 p-2 w-full border rounded-md focus:ring focus:ring-blue-300">
                    <option value="" disabled selected>Select your garage number</option>
                    <optgroup label="Building 4">
                        <option value="402">402</option>
                        <option value="404">404</option>
                        <option value="406">406</option>
                        <option value="408">408</option>
                        <option value="410">410</option>
                        <option value="412">412</option>
                        <option value="414">414</option>
                    </optgroup>
                    <optgroup label="Building 5">
                        <option value="502">502</option>
                        <option value="504">504</option>
                        <option value="506">506</option>
                        <option value="508">508</option>
                        <option value="510">510</option>
                        <option value="512">512</option>
                        <option value="514">514</option>
                        <option value="516">516</option>
                    </optgroup>
                    <optgroup label="Building 6">
                        <option value="602">602</option>
                        <option value="604">604</option>
                        <option value="606">606</option>
                        <option value="608">608</option>
                        <option value="610">610</option>
                        <option value="612">612</option>
                        <option value="614">614</option>
                    </optgroup>
                    <optgroup label="Building 8">
                        <option value="802">802</option>
                        <option value="803">803</option>
                        <option value="804">804</option>
                        <option value="805">805</option>
                        <option value="806">806</option>
                        <option value="807">807</option>
                        <option value="808">808</option>
                        <option value="809">809</option>
                        <option value="810">810</option>
                        <option value="811">811</option>
                        <option value="812">812</option>
                        <option value="813">813</option>
                    </optgroup>
                    <optgroup label="Building 9">
                        <option value="901">901</option>
                        <option value="902">902</option>
                        <option value="903">903</option>
                        <option value="904">904</option>
                        <option value="905">905</option>
                        <option value="906">906</option>
                        <option value="907">907</option>
                        <option value="908">908</option>
                        <option value="909">909</option>
                        <option value="910">910</option>
                        <option value="911">911</option>
                        <option value="912">912</option>
                        <option value="913">913</option>
                        <option value="914">914</option>
                        <option value="915">915</option>
                        <option value="916">916</option>
                    </optgroup>
                </select>
            </div>
            <div>
                <label for="design" class="block text-sm font-medium text-gray-700">Upload Design Plans (PDF/Image)</label>
                <input type="file" id="design" name="design" accept=".pdf,.jpg,.png" class="mt-1 p-2 w-full border rounded-md">
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">Submit</button>
        </form>
        <p id="status" class="mt-4 text-center text-green-600 hidden">Submission successful! Avant Development Group will contact you soon.</p>
    </div>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js"></script>
    <script>
        // Firebase configuration (replace with your Firebase project details)
        // PASTE YOUR FIREBASE CONFIG HERE FROM FIREBASE CONSOLE
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT_ID.appspot.com",
            messagingSenderId: "YOUR_SENDER_ID",
            appId: "YOUR_APP_ID"
        };
        firebase.initializeApp(firebaseConfig);
        const storage = firebase.storage();
        // Form submission
        document.getElementById('hvacForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const garage = document.getElementById('garage').value;
            const design = document.getElementById('design').files[0];
            // Upload design file to Firebase Storage
            let designUrl = '';
            if (design) {
                const storageRef = storage.ref(`designs/${garage}_${Date.now()}_${design.name}`);
                await storageRef.put(design);
                designUrl = await storageRef.getDownloadURL();
            }
            // Send data to serverless function (e.g., for Twilio SMS and Google Calendar)
            const response = await fetch('YOUR_SERVERLESS_FUNCTION_URL', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, garage, designUrl })
            });
            if (response.ok) {
                document.getElementById('status').classList.remove('hidden');
                document.getElementById('hvacForm').reset();
            } else {
                alert('Error submitting form. Please try again.');
            }
        });
    </script>
</body>
</html>
