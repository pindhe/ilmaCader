from django import forms
from django.forms import inlineformset_factory

from documents.models import validate_upload

from .models import (
    FamilyProfile,
    Parent,
    Spouse,
    Child,
    Health,
    Employment,
    Property,
)


class FamilyProfileForm(forms.ModelForm):
    national_id_document = forms.FileField(
        required=False,
        label="National ID upload",
        help_text="Upload a PDF or image of your National ID (PDF, JPG, PNG — max 10MB).",
        validators=[validate_upload],
        widget=forms.ClearableFileInput(attrs={"class": "form-input", "accept": ".pdf,.jpg,.jpeg,.png"}),
    )

    class Meta:
        model = FamilyProfile
        fields = [
            "first_name",
            "middle_name",
            "last_name",
            "gender",
            "date_of_birth",
            "national_id",
            "birth_certificate_number",
            "phone",
            "email",
            "photo",
            "occupation",
            "education",
            "blood_group",
            "nationality",
            "religion",
            "address",
            "region",
            "district",
            "city",
        ]
        widgets = {
            "date_of_birth": forms.DateInput(attrs={"type": "date", "class": "form-input"}),
            "address": forms.Textarea(attrs={"rows": 3, "class": "form-input"}),
            "gender": forms.Select(attrs={"class": "form-input"}),
        }
        labels = {
            "national_id": "National ID number",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            if name not in ("photo", "address", "gender", "date_of_birth", "national_id_document"):
                field.widget.attrs.setdefault("class", "form-input")
            if name == "photo":
                field.widget.attrs.setdefault("class", "form-input")
        self.fields["national_id"].help_text = "Enter the ID number shown on your card."


class ParentForm(forms.ModelForm):
    class Meta:
        model = Parent
        exclude = ("profile",)
        widgets = {
            "father_alive": forms.Select(attrs={"class": "form-input"}),
            "mother_alive": forms.Select(attrs={"class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-input")


class SpouseForm(forms.ModelForm):
    class Meta:
        model = Spouse
        exclude = ("profile",)
        widgets = {
            "marriage_date": forms.DateInput(attrs={"type": "date", "class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-input")


class ChildForm(forms.ModelForm):
    class Meta:
        model = Child
        fields = ("name", "gender", "birth_date", "school")
        widgets = {
            "birth_date": forms.DateInput(attrs={"type": "date", "class": "form-input"}),
            "gender": forms.Select(attrs={"class": "form-input"}),
            "name": forms.TextInput(attrs={"class": "form-input"}),
            "school": forms.TextInput(attrs={"class": "form-input"}),
        }


ChildFormSet = inlineformset_factory(
    FamilyProfile,
    Child,
    form=ChildForm,
    extra=1,
    can_delete=True,
)


class HealthForm(forms.ModelForm):
    class Meta:
        model = Health
        exclude = ("profile",)
        widgets = {
            "medical_conditions": forms.Textarea(attrs={"rows": 3, "class": "form-input"}),
            "disabilities": forms.Textarea(attrs={"rows": 3, "class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-input")


class EmploymentForm(forms.ModelForm):
    class Meta:
        model = Employment
        exclude = ("profile",)
        widgets = {
            "employment_status": forms.Select(attrs={"class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-input")


class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        exclude = ("profile",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-input")
