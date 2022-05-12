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
        initTree('#tree', (collectionId, exchangeId) => {
            document.getElementById('right-sidebar').style.visibility = 'hidden';
            loadGraph(collectionId, exchangeId, loadProperties);
        });
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
    const sidebar = document.getElementById('right-sidebar');
    sidebar.innerHTML = '';
    sidebar.style.visibility = 'visible';
    const tree = jsonview.create(asset);
    jsonview.render(tree, sidebar);
}
