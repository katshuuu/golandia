package validation

import "testing"

func TestValidateDisplayName(t *testing.T) {
	if _, err := ValidateDisplayName("Анна"); err != nil {
		t.Fatal(err)
	}
	if _, err := ValidateDisplayName("   "); err == nil {
		t.Fatal("expected empty name error")
	}
	if _, err := ValidateDisplayName("bad@mail"); err == nil {
		t.Fatal("expected charset error")
	}
}

func TestValidateAvatarDataURL(t *testing.T) {
	if err := ValidateAvatarDataURL(""); err != nil {
		t.Fatal(err)
	}
	if err := ValidateAvatarDataURL("data:image/png;base64,abc"); err != nil {
		t.Fatal(err)
	}
	if err := ValidateAvatarDataURL("http://x"); err == nil {
		t.Fatal("expected prefix error")
	}
}

func TestValidateUserID(t *testing.T) {
	if err := ValidateUserID("anonymous"); err != nil {
		t.Fatal(err)
	}
	if err := ValidateUserID("00000000-0000-0000-0000-000000000001"); err != nil {
		t.Fatal(err)
	}
	if err := ValidateUserID("not-uuid"); err == nil {
		t.Fatal("expected uuid error")
	}
}

func TestValidateChatMessage(t *testing.T) {
	if _, err := ValidateChatMessage("Привет"); err != nil {
		t.Fatal(err)
	}
	if _, err := ValidateChatMessage("   "); err == nil {
		t.Fatal("expected empty message")
	}
}
