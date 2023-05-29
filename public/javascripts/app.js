document.addEventListener('DOMContentLoaded', event => {

  const CONTACT_LIST = document.querySelector('#contact_template').innerHTML;
  const CONTACT_TEMPLATE = Handlebars.compile(CONTACT_LIST);

  const APP = {
    form() {
      return document.querySelector('#createContact');
    },
    gatherFormData(form) {
      let formData = new FormData(form);
      let holdingObj = {};
      let tagHolder = [];
      formData.forEach((value, key) => {
        if (key === 'tags') {
          tagHolder.push(value);
        } else {
          holdingObj[key] = value;
        }
      });
      holdingObj['tags'] = tagHolder.join(',');
      let validation = this.validateFormData(holdingObj);
      if (validation === true) {
        return JSON.stringify(holdingObj);
      } else {
        return { message: validation };
      }
    },
    validateFormData(holdingObj) {
      for (key in holdingObj) {
        if (key === 'tags') continue;
        if (!holdingObj[key]) {
          return 'Empty values are not allowed.';
        } else if(key === 'email' && !holdingObj[key].match(/[@]/g)) {
          return 'Enter a valid email.';
        } else if(key === 'phone_number' && holdingObj[key].match(/[a-z]/ig)) {
          return 'Enter a valid phone number.';
        }
      }
      return true;
    },
    addFormListener() {
      let form = this.form();
      form.addEventListener('submit', event => {
        event.preventDefault();

        let json = this.gatherFormData(this.form())
    
        if (!json.message) {
          fetch(
            'http://localhost:3000/api/contacts/',
            { method: 'POST',
              headers: {'Content-Type': 'application/json; charset=UTF-8'},
              body: json,
            }
          ).then((response) => {
            console.log(response.status);
            this.addContact();
          });
        } else {
          let oldMessage = document.querySelector('#errormessage');
          if (oldMessage) oldMessage.remove();
          let errorMessage = document.createElement('p');
          errorMessage.id = 'errormessage';
          console.log(json.message);
          errorMessage.textContent = json.message;
          this.form().insertAdjacentElement('afterend', errorMessage);
          setTimeout(() => { errorMessage.remove() }, 5000);
        }
      });
    },
    addContact() {
      fetch(
        'http://localhost:3000/api/contacts/',
        { method: 'GET',
        }
      ).then(response => {
        return response.json();
      }).then(data => {
        let newContact = data.slice(-1)[0];
        document.querySelector('#viewlist')
          .insertAdjacentHTML('afterbegin', CONTACT_TEMPLATE(newContact));
        this.addButtons(newContact);
        this.resetAddContactForm();
      })
    },
    showContacts(searchVal='.', tag) {
      fetch(
        'http://localhost:3000/api/contacts/',
        { method: 'GET',
        }
      ).then(response => {
        return response.json();
      }).then(data => {
        for (let i = 0; i < data.length; i += 1) {
          let contact = data[i];
          let list = document.querySelector('#viewlist');
          if (!this.searchMatch(searchVal, contact.full_name)) continue;
          if (!this.tagMatch(contact, tag)) continue;
          list.insertAdjacentHTML('afterbegin', CONTACT_TEMPLATE(contact));
          this.addButtons(contact);
        }
      })
    },
    addSearchListener() {
      let search = document.querySelector('#search');
      search.addEventListener('input', event => {
        this.resetContactList();
        let searchVal = search.value;
        this.showContacts(searchVal);
      });
    },
    searchMatch(searchVal, name) {
      console.log(searchVal);
      let regex = new RegExp(searchVal, 'i');
      return name.match(regex);
    },
    tagMatch(contact, tag) {
      if (tag === undefined) return true;
      return contact.tags.split(',').includes(tag);
    },
    resetContactList() {
      let list = document.querySelector('#viewlist');
      list.innerHTML = '';
    },
    resetAddContactForm() {
      let contactForm = this.form();
      contactForm.querySelector("input[id='name']").value = '';
      contactForm.querySelector("input[id='phone']").value = '';
      contactForm.querySelector("input[id='email']").value = '';
      contactForm.querySelector("#tags").value = '';
    },
    addButtons(contact) {
      let deleteButton = document.querySelector(`#delete_${contact.id}`);
      this.addDeleteEvent(deleteButton, contact.id);
      let editButton = document.querySelector(`#edit_${contact.id}`);
      this.addEditButton(editButton, contact);
      if (contact.tags) this.addTagButtons(editButton, contact);
    },
    addTagButtons(editButton, contact) {
      let tags = contact.tags;
      let tagsArr = tags.split(',');
      for (let i = 0; i < tagsArr.length; i += 1) {
        let tag = tagsArr[i];
        let tagButton = document.createElement('button');
        let br = document.createElement('span');
        br.innerHTML = '<br>';
        tagButton.id = `#tag${i}_${contact.id}`;
        tagButton.textContent = `Tag: ${tag}`;
        editButton.insertAdjacentElement('beforebegin', tagButton);
        tagButton.insertAdjacentElement('afterend', br);

        tagButton.addEventListener('click', event => {
          this.resetContactList();
          this.showContacts('.', tag);
        });
      }
    },
    addDeleteEvent(deleteButton, contactID) {
      let json = JSON.stringify({ id: contactID });
      deleteButton.addEventListener('click', event => {
        fetch(
          `http://localhost:3000/api/contacts/${contactID}`,
          { method: 'DELETE',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            body: json,
          }
        ).then((response) => {
          console.log(response.status);
          let contact = document.querySelector(`#id_${contactID}`);
          contact.remove();
        });
      });
    },
    addEditButton(editButton, contactData) {
      editButton.addEventListener('click', event => {
        let contact = document.querySelector(`#id_${contactData.id}`);
        let editForm = this.form().cloneNode(true);
        editForm.id = `editContact_${contactData.id}`;
        editForm.querySelector("input[id='name']").value = `${contactData.full_name}`;
        editForm.querySelector("input[id='phone']").value = `${contactData.phone_number}`;
        editForm.querySelector("input[id='email']").value = `${contactData.email}`;
  
        let cancelButton = document.createElement('button'); 
        cancelButton.textContent = 'Cancel';
        cancelButton.id = `cancel_${contactData.id}`;
        editForm.querySelector("input[type='submit']").insertAdjacentElement('afterend', cancelButton);

        let contactBackup = contact.cloneNode(true);
        contact.replaceWith(editForm);

        this.addCancelEvent(editForm, contactBackup, contactData);
        this.addEditSubmissionEvent(editForm, contactData);
      });
    },
    addCancelEvent(editForm, contactBackup, contactData) {
      let cancelButton = document.querySelector(`#cancel_${contactData.id}`);
      cancelButton.addEventListener('click', event => {
        editForm.replaceWith(contactBackup);
        this.addButtons(contactData);
      });
    },
    addEditSubmissionEvent(editForm, contactData) {
      editForm.addEventListener('submit', event => {
        event.preventDefault();

        let json = this.gatherFormData(editForm);

        if (!json.message) {
          fetch(
            `http://localhost:3000/api/contacts/${contactData.id}`,
            { method: 'PUT',
              headers: {'Content-Type': 'application/json; charset=UTF-8'},
              body: json,
            }
          ).then((response) => {
            return response.json();
          }).then((data) => {
            editForm.insertAdjacentHTML('beforebegin', CONTACT_TEMPLATE(data));
            editForm.remove();
            this.addButtons(data);
          });
        } else {
          let oldMessage = document.querySelector('#errormessage');
          if (oldMessage) oldMessage.remove();
          let errorMessage = document.createElement('p');
          console.log(json.message);
          errorMessage.id = 'errormessage';
          errorMessage.textContent = json.message;
          editForm.insertAdjacentElement('afterend', errorMessage);
          setTimeout(() => { errorMessage.remove() }, 5000);
        }
      });
    },
    showAllContactsButton() {
      let showAllButton = document.querySelector('#showall');
      showAllButton.addEventListener('click', event => {
        this.resetContactList();
        this.showContacts();
      });
    },
    init() {
      this.showContacts();
      this.addFormListener();
      this.addSearchListener();
      this.showAllContactsButton();
    }
  }

  APP.init();
});