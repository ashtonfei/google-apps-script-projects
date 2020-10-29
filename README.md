# GAS-070 Google Form Approval

### Description

This is an approval workflow built with Google Form, Gmail, and Google Apps Script.

### If you prefer to use clasp

[GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-259) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type

Google Form

### Configuration

- Approval flows

```javascript
// Define the approval flows in this object
const FLOWS = {
	defaultFlow: [
		{
			email: "test@gmail.com",
			name: "Ashton Fei (default 1)",
			title: "Team Lead",
		},
		{
			email: "test@gmail.com",
			name: "Ashton Fei (default 2)",
			title: "Manager",
		},
	],
	HR: [
		{
			email: "test@gmail.com",
			name: "HR Lead",
			title: "HR Team Lead",
		},
		{
			email: "test@gmail.com",
			name: "HR Manager",
			title: "HR Manager",
		},
	],
	IT: [
		{
			email: "test@gmail.com",
			name: "IT Lead",
			title: "IT Team Lead",
		},
		{
			email: "test@gmail.com",
			name: "IT Manager",
			title: "IT Manager",
		},
		{
			email: "test@gmail.com",
			name: "IT President",
			title: "IT President",
		},
	],
};
```

- Web App Url

```javascript
this.url =
	"https://script.google.com/macros/s/AKfycbzKrd0zkrNgCm54Ycdv3e82BWxe4r34zSx4iZ0nTMU_TuhApgY/exec"; // IMPORTANT - copy the web app url after deploy
```

- Header name of flow key

```javascript
this.flowHeader = "Department"; // IMPORTANT - key field for your flows
```

### Screenshots

- Requester notification
  ![image](https://user-images.githubusercontent.com/16481229/97604066-0b086880-1a48-11eb-8263-56a027cc7040.png)

- Approver notification
  ![image](https://user-images.githubusercontent.com/16481229/97604220-35f2bc80-1a48-11eb-85b7-2852af65846e.png)
- Approver action page
  ![image](https://user-images.githubusercontent.com/16481229/97604638-aef21400-1a48-11eb-8a05-98288cbe96e6.png)

- Requester notification (final result)
  ![image](https://user-images.githubusercontent.com/16481229/97604372-5f134d00-1a48-11eb-8b8f-84748c0764bb.png)
  ![image](https://user-images.githubusercontent.com/16481229/97605013-1ad47c80-1a49-11eb-9e30-ffec44331609.png)
- Approval progress check page
  ![image](https://user-images.githubusercontent.com/16481229/97605179-4c4d4800-1a49-11eb-8334-9591a4243890.png)

### YouTube

- Check on YouTube [GAS-070 Google Form Approval](https://youtu.be/JVH72QDiOfY)
- More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)
