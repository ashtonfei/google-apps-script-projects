<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <form @submit.prevent="submit">
      <label>{{ formData.user.label }}</label>
      <input type="text" v-model="formData.user.value" />
      <label>{{ formData.email.label }}</label>
      <input type="email" v-model="formData.email.value" />
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data() {
    return {
      msg: "GAS-081 Vue GAS Web App Tempate",
      formData: {
        user: {
          value: "",
          label: "User Name",
        },
        email: {
          value: "",
          label: "Email",
        },
      },
    };
  },
  methods: {
    submit: function () {
      const data = [this.formData.user.value, this.formData.email.value];
      google.script.run.createUser(data);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
