# 239 Practice Project

One feature that may be unusual: the method `addEditButton` starting on line 139. It uses `replaceWith` to swap the contact element (one contact in a list of contacts) with an edit form for that contact. The form submit event calls the API, updates the contact, and the response is inserted with a template `beforebegin` to the edit form. The edit form element is then removed.
