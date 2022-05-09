import { initTree } from './sidebar.js';
import { loadGraph } from './graph.js';

const login = document.getElementById('login');
try {
    const resp = await fetch('/api/auth/profile');
    if (resp.ok) {
        const user = await resp.json();
        login.innerText = `Logout (${user.name})`;
        login.onclick = () => {
            // Log the user out (see https://forge.autodesk.com/blog/log-out-forge)
            const iframe = document.createElement('iframe');
            iframe.style.visibility = 'hidden';
            iframe.src = 'https://accounts.autodesk.com/Authentication/LogOut';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                window.location.replace('/api/auth/logout');
                document.body.removeChild(iframe);
            };
        }
        initTree('#tree', (collectionId, exchangeId) => loadGraph(document.getElementById('preview'), collectionId, exchangeId, loadProperties));
    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/api/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See console for more details.');
    console.error(err);
}

async function loadProperties(asset) {
    function populate(ul, obj) {
        for (const key of Object.keys(obj)) {
            const li = document.createElement('li');
            if (obj[key] instanceof Array || obj[key] instanceof Object) {
                const nestedList = document.createElement('ul');
                populate(nestedList, obj[key]);
                li.innerText = `${key}:`;
                li.appendChild(nestedList);
            } else {
                li.innerText = `${key}: ${obj[key]}`;
            }
            ul.appendChild(li);
        }
    }
    const ul = document.getElementById('properties');
    ul.innerHTML = '';
    populate(ul, asset);
}
