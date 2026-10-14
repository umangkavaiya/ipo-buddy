const fs = require('fs');
const path = require('path');

const screens = [
  {
    dir: '00-homepage',
    name: 'homepage',
    title: 'IPO Buddy - Homepage & Syndicate Platform',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgzZDhmNWEwNTNkZjQ3YzM4ZjJhZTFlODhlZWM3N2Q4EgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=96797242',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1VPOnzrJrYzU-BvwxM0RaUfkF9A_I5kuC75clbgX5KKqkCNV37te8-7Mu5n4FkQwOlNuT4-2MT1_7tKMcH9i1vkVMpc8MqyAaXuPTq8yvHCA0u2dbWqayb1PsPabNn4_eCT22jQNunHAuPIgk3w43a8ikTGuHCGHyHNT530sfnSV72ZB9jWnrrybBfckVnvA1SMs70q02IEvp2495BcElCWc3CvSM3VCpFXQ6wYzmN3CYpLOKD3aYDpPcA'
  },
  {
    dir: '01-capital-flow-dashboard',
    name: 'dashboard',
    title: 'Capital Flow & Portfolio Dashboard',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTU0YTQ5MDU2ZDUwNDczNmMxNDRkMTI4YTcwEgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=89354086',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1XeVAbPNuJ99hLrR0YwqtVj5ZJVKk6zU2Xu3VCTUR4MzsGh4JAxxz99AcPE0nNknF_8XcppGo2SmkPhwOOIirg52D-EUICOogtEjibxYkoj2wQ2KmmFwm8dy6ZSkdkSpRVoKXlHDxrlMj7UPqfdBSb7dqkgcm7Vnz6RgtvSQPbIRa7rodZ6E4s57hU66j5PGuSiWcYfRVbewAcQznb223RzrkY2QCARR0VALZ9loXj0m0If4JLs7O8xFDg-'
  },
  {
    dir: '02-smart-ipo-application',
    name: 'apply',
    title: 'Smart IPO Application',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTU0YTQyYmIwMWMwNzNhYzU5MDBkMDI5YThlEgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=89354086',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1US8Ydi8ATIkD8k1oEKd0FGCRoLOtYOJatyaDGaPWvt8jMX4wZisxbziQ9KzgIdMtihynS_i4E3dsyCVuMS_W2iv5qGUKN4HACWeo6J_BcGRDANuehvwgijY09aHgvGt5V70nIfTgsj3oHmpnsabecgBKOnZZJxzQLrGmgU0sjHyofdj0BN4QOlKDwevKRgDcGHzRm5PqXEf8TyQplKbIbP_iSRMQCKEKImALb0zUCokDlMf5JSIQrp91wf'
  },
  {
    dir: '03-linked-accounts-manager',
    name: 'linked-accounts',
    title: 'Linked Accounts Manager (Multi-PAN)',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTU0YTNkMWZmMzIwMmE5YTIyN2M3MjQ0MjlkEgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=89354086',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1Vf07iK7exVGnEU0cSaBNiinu7J2vDLg9-1LqkZx3dg2gkkp0Aq85O8EJb42nFp-Jcw6P0GRsKSb1SxNoldhJEEyrlsRlD3v3TcM8KzSWN6SbVHq2pASEBqEvMI1fzRxthXSadSiG6hPaQXYqYcZKNTcnUKW5SNjiuqWZbRxVkEZirAe35LUrtPIYqg1WXXUx3zGwr4b2rDjJN1kslIUQHUfsSHxezTHfN1JdvSZz6gPo59jEDOTAe3a2U-'
  },
  {
    dir: '04-allocation-analytics',
    name: 'analytics',
    title: 'Allocation History & Analytics',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTU0YTQxYjA0MzAwNTc2MDFlN2U1MGUxNjI1EgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=89354086',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1U59L5mzS_al53bpcnHnyreeVVMUlpjvf3WpIF79TroyhZqQVO4f-aKQMyGp3dTIiO_R9uzLyoz8f0RwcP_rOtZ5JhaEHXd4Qry4dmQp8ei3QN_G11P-LCdANkj7FvkdgDfHL1jVmvv2LvrM2JOhfFQwpFBh-bXdCyhC4J7Q--I-LkPRvi92pq_rWHAAUh91mdOnJahyA1pLdkj4TqojWeR7DxgVZd2VGy9DK9gWzjYlE6blWgTp3qjr-r3'
  },
  {
    dir: '05-notifications-activity',
    name: 'notifications',
    title: 'Notifications & Activity Log',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YTU3NTkzN2E5NzQwMzZjNzFjNGRjMzJjMDEzEgsSBxDv1sK0rxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMwMDUzNTA4NjIyMzQ5MjIyNA&filename=&opi=89354086',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1Uzdq_Ss7XnfSCUJ7CYI16hz0uNlKnRRsFyr_YVOr-wxpET7DHv6_nFTX4NWze23rEkkBzG54Ie1bNd_mt5TPsTmln-G8Y3Ruvc3ooQawM6OIry9QzNFsp1UuN6agwcilV_BCR2YULt9B-AWZ3oLKlgM71TJB8OHgLNLtOrU37VutphiKDO-T3zU2UHE-1mpxgjUuTUMZ7Va8fRN5PIyRcABprAh-YZ8ITO-BZjR5gQcclcWvqxSAXP7NqW'
  }
];

const baseDir = path.join(__dirname, '..', 'design', 'screens');

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

async function run() {
  for (const item of screens) {
    const targetDir = path.join(baseDir, item.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(`Downloading: ${item.title}...`);
    if (item.htmlUrl) {
      const htmlPath = path.join(targetDir, `${item.name}.html`);
      await downloadFile(item.htmlUrl, htmlPath);
      console.log(`  -> HTML saved: ${htmlPath} (${(fs.statSync(htmlPath).size / 1024).toFixed(1)} KB)`);
    }

    if (item.imgUrl) {
      const imgPath = path.join(targetDir, `${item.name}.png`);
      await downloadFile(item.imgUrl, imgPath);
      console.log(`  -> Screenshot saved: ${imgPath} (${(fs.statSync(imgPath).size / 1024).toFixed(1)} KB)`);
    }
  }
  console.log('All screen designs downloaded successfully!');
}

run().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
