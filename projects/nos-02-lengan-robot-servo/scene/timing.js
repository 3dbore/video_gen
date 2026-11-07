// Every moment in the film lives here. A note like "title is a beat late" changes one line.
// Cues sit on word start times from voice/transcript.json. The word is named where it helps.
window.TIMING = {
  film: { duration: 50, fps: 30 },
  beat: 0.5, // seconds in one "beat" when a note says "a beat late".
  scenes: {
    hook: { start: 0, dur: 5.4 },
    desain_gratis: { start: 5.4, dur: 7.3 },
    tiga_bagian: { start: 12.7, dur: 9.5 },
    harga_motor: { start: 22.2, dur: 15.7 },
    jujur_soal_harga: { start: 37.9, dur: 5 },
    ajakan: { start: 42.9, dur: 7.1 },
  },
  cues: {
    // Beat 1: hook, navy
    arm_base_in: 0,
    arm_lower_in: 0.1,
    arm_forearm_in: 0.5,
    hook_label_in: 0.7,
    arm_gripper_in: 0.9,
    hook_servo_mark: 2.02, // "servo"
    arm_bend: 3.7, // just before "gratis" at 3.78

    // Beat 2: free design, white
    gratis_title_in: 5.4,
    arm_name_in: 6.24, // "compact"
    license_card_in: 8.18, // "desainnya"
    gratis_underline: 9.26, // "gratis"
    credit_type: 9.86, // "jadi"

    // Beat 3: three parts, cobalt
    parts_title_in: 12.8, // "isinya"
    box_motor_in: 14.7, // "motor"
    label_motor_in: 15.8, // "menggerakkan"
    arrow_motor_in: 16.5,
    box_driver_in: 17.16, // "papan"
    label_driver_in: 18.28, // "mengatur"
    arrow_driver_in: 19.2,
    box_arduino_in: 20.2, // "Arduino"
    label_arduino_in: 20.68, // "sebagai"

    // Beat 4: prices, navy
    price_question_in: 22.34, // "berapa"
    mg90s_label_in: 24.7, // "MG90S"
    count_low: 25.1,
    count_low_stop: 26.5, // "dua puluh dua ribu"
    count_high: 27.5,
    count_high_stop: 28.87, // "tujuh puluh dua ribu"
    hero_land: 29.2,
    hero_collapse: 29.5,
    source_line_in: 30.3,
    mg996r_label_in: 31.39, // "MG996R"
    mg996r_tag_in: 33.01, // "lebih kuat"
    mg996r_price_in: 34.65, // "lima puluh tiga"

    // Beat 5: only the motor price, white
    honest_title_in: 38, // "harga"
    honest_motors_in: 39.96, // "jumlah"
    honest_power_in: 41, // "power supply"

    // Beat 6: call to action, cobalt. Nothing moves after cta_credit_in settles.
    cta_logo_in: 43, // "mau"
    cta_text_in: 43.46, // "part-nya"
    cta_tanya_mark: 44.28, // "tanya"
    cta_contact_in: 45.82, // "WhatsApp"
    cta_credit_in: 46.86, // "DM"
  },
};
